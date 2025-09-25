// Chat.jsx — Tailwind only
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { Plus, X, CheckCheck, Bell } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";


/* Helpers pour comparer IDs/usernames proprement */
const toId = (v) => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : n;
};
const toName = (s) => (s || "").toString().trim().toLowerCase();
const sameId = (a, b) => String(toId(a)) === String(toId(b));
const sameName = (a, b) => toName(a) === toName(b);

export default function Chat() {
  const [x, setX] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [listMsg, setListMsg] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Déconnecté");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef(null);
  const notificationSocketRef = useRef(null);
  const authDoneRef = useRef(false);
  const pendingOutboxRef = useRef([]);
  const pendingReadsRef = useRef([]);
  const messagesEndRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const notificationReconnectTimerRef = useRef(null);

  const location = useLocation();
  const locationUser = location.state?.user || null;

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const wsReady = () =>
    socketRef.current?.readyState === WebSocket.OPEN && authDoneRef.current;

  const sendWS = useCallback((payload) => {
    if (wsReady()) {
      try {
        socketRef.current.send(JSON.stringify(payload));
      } catch {
        if (payload.type === "message_read") pendingReadsRef.current.push(payload);
        else pendingOutboxRef.current.push(payload);
      }
    } else {
      if (payload.type === "message_read") pendingReadsRef.current.push(payload);
      else pendingOutboxRef.current.push(payload);
    }
  }, []);

  // Pré-sélection depuis navigation
  useEffect(() => {
    if (locationUser != null) {
      setReceiver(locationUser.id);
      setReceiverInfo(locationUser);
      setListMsg([]);
    }
  }, [locationUser]);

  // Permission notifs
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Récup data (users + convos)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        const usersRes = await axios.get("http://127.0.0.1:8000/api/userss/", { headers });
        const conversationsRes = await axios.get("http://127.0.0.1:8000/api/my/", { headers });

        setUsers(usersRes.data.filter((u) => u.id !== currentUser.id));

        const convsWithLastMessage = await Promise.all(
          conversationsRes.data.map(async (conv) => {
            try {
              const res = await axios.get(
                `http://127.0.0.1:8000/api/last-message/${conv.id}/`,
                { headers }
              );
              const res2 = await axios.get(
                `http://127.0.0.1:8000/api/last-message-not-lu/${conv.id}/`,
                { headers }
              );
              return {
                ...conv,
                last_message: res.data.contenu || "Aucun message...",
                last_message_not_lu: res2.data.nb_msg?.toString() || "0",
              };
            } catch {
              return { ...conv, last_message: "Erreur...", last_message_not_lu: "0" };
            }
          })
        );

        setConversations(convsWithLastMessage);
        const totalUnread = convsWithLastMessage.reduce(
          (t, c) => t + parseInt(c.last_message_not_lu || "0"),
          0
        );
        setUnreadCount(totalUnread);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser.id, token]);

  // Historique messages d'un receiver (⚠️ compat sender_username)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiver) return;
      try {
        setLoading(true);
        const res = await axios.get(
          `http://127.0.0.1:8000/api/messagess/${receiver}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const meName = toName(currentUser?.username);
        console.log(res.data)
        // L’API renvoie: { id, sender_username, receiver_username, contenu, date_envoi, is_read }
        setListMsg(
          res.data.map((msg) => ({
            id: msg.id,
            contenu: msg.contenu,
            date_envoi: msg.date_envoi,
            is_read: !!msg.is_read,
            // on garde aussi les usernames pour comparaison
            sender_username: msg.sender_username,
            receiver_username: msg.receiver_username,
            // fallback au cas où (anciens champs)
            sender: msg.sender,
            receiver: msg.receiver,
            // séparation fiable via username, sinon via id
            is_own: msg.is_own,
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [receiver, currentUser.id, token, currentUser?.username]);

  useEffect(scrollToBottom, [listMsg]);

  // Connexion WS (chat)
  useEffect(() => {
    if (!receiver) return;

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const socketUrl = `${wsProtocol}127.0.0.1:8000/ws/chat/${currentUser.id}/${receiver}/`;

    setConnectionStatus("Connexion en cours...");
    const ws = new WebSocket(socketUrl);
    socketRef.current = ws;

    const flushQueues = () => {
      if (!wsReady()) return;
      while (pendingOutboxRef.current.length) {
        ws.send(JSON.stringify(pendingOutboxRef.current.shift()));
      }
      while (pendingReadsRef.current.length) {
        ws.send(JSON.stringify(pendingReadsRef.current.shift()));
      }
    };

    const handleOpen = () => {
      setIsWebSocketConnected(true);
      setConnectionStatus("Authentification...");
      ws.send(JSON.stringify({ type: "authentication", token }));
    };

    const handleMessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "authentication") {
        if (data.status === "success") {
          authDoneRef.current = true;
          setConnectionStatus("Connecté");
          flushQueues();
          markThreadAsRead();
        } else {
          setConnectionStatus("Erreur d'authentification");
          authDoneRef.current = false;
        }
        return;
      }

      if (data.type === "chat_message") {
        setX((v) => v + 1);

        // On supporte deux formats WS: avec usernames OU avec ids
        const meName = toName(currentUser?.username);
        const isOwn = data.sender_username
          ? sameName(data.sender_username, meName)
          : data.sender_id === currentUser.id;

        setListMsg((prev) => [
          ...prev,
          {
            id: data.message_id,
            // on stocke tout ce qu’on a pour robustesse
            sender: data.sender_id,
            receiver: data.receiver_id,
            sender_username: data.sender_username,
            receiver_username: data.receiver_username,
            contenu: data.message,
            date_envoi: data.timestamp,
            is_own:data.sender_id==currentUser.id,
            is_read:
              data.receiver_username
                ? sameName(data.receiver_username, meName) && receiver === data.sender_id
                : data.receiver_id === currentUser.id && receiver === data.sender_id,
          },
        ]);

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === data.sender_id || c.id === data.receiver_id) {
              const unread = parseInt(c.last_message_not_lu || "0");
              const newUnread =
                data.receiver_id === currentUser.id && receiver !== data.sender_id
                  ? unread + 1
                  : 0;
              return {
                ...c,
                last_message: data.message,
                last_message_not_lu: newUnread.toString(),
              };
            }
            return c;
          })
        );

        if (data.receiver_id === currentUser.id && receiver !== data.sender_id)
          setUnreadCount((prev) => prev + 1);
        if (data.receiver_id === currentUser.id && receiver === data.sender_id)
          sendWS({ type: "message_read", message_id: data.message_id });
      }

      if (data.type === "message_read") {
        setListMsg((prev) =>
          prev.map((m) => (m.id === data.message_id ? { ...m, is_read: true } : m))
        );
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === receiver) {
              const newUnread = Math.max(0, parseInt(c.last_message_not_lu || "0") - 1);
              return { ...c, last_message_not_lu: newUnread.toString() };
            }
            return c;
          })
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    };

    const handleError = () => {
      setConnectionStatus("Erreur de connexion");
      setIsWebSocketConnected(false);
    };
    const scheduleReconnect = () => {
      if (reconnectTimerRef.current) return;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        setReceiver((prev) => prev);
      }, 3000);
    };
    const handleClose = () => {
      setConnectionStatus("Déconnecté");
      setIsWebSocketConnected(false);
      authDoneRef.current = false;
      scheduleReconnect();
    };

    ws.addEventListener("open", handleOpen);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("error", handleError);
    ws.addEventListener("close", handleClose);

    return () => {
      ws.removeEventListener("open", handleOpen);
      ws.removeEventListener("message", handleMessage);
      ws.removeEventListener("error", handleError);
      ws.removeEventListener("close", handleClose);
      try {
        ws.close();
      } catch {}
    };
  }, [receiver, currentUser.id, token, sendWS, currentUser?.username]);

  // WS notifications
  useEffect(() => {
    if (!currentUser?.id) return;

    if (notificationSocketRef.current) {
      try {
        notificationSocketRef.current.close();
      } catch {}
      notificationSocketRef.current = null;
    }
    if (notificationReconnectTimerRef.current) {
      clearTimeout(notificationReconnectTimerRef.current);
      notificationReconnectTimerRef.current = null;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const notificationUrl = `${wsProtocol}127.0.0.1:8000/ws/notifications/${currentUser.id}/`;

    const notificationWs = new WebSocket(notificationUrl);
    notificationSocketRef.current = notificationWs;

    const handleNotificationMessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "notification") {
          const msg = data.msg;
          const senderId = msg.sender_id;

          if (receiver !== senderId) {
            const senderUser = users.find((u) => u.id === senderId);
            const senderName = senderUser ? getDisplayName(senderUser) : "Quelqu'un";
            toast.info(`${senderName} vous a envoyé un message: "${msg.contenu}"`, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === senderId) {
                const unread = parseInt(c.last_message_not_lu || "0") + 1;
                return {
                  ...c,
                  last_message: msg.contenu,
                  last_message_not_lu: unread.toString(),
                };
              }
              return c;
            })
          );

          setUnreadCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleNotificationClose = () => {
      notificationReconnectTimerRef.current = setTimeout(() => {}, 5000);
    };

    notificationWs.addEventListener("message", handleNotificationMessage);
    notificationWs.addEventListener("close", handleNotificationClose);

    return () => {
      notificationWs.removeEventListener("message", handleNotificationMessage);
      notificationWs.removeEventListener("close", handleNotificationClose);
      try {
        notificationWs.close();
      } catch {}
    };
  }, [currentUser?.id, receiver, users]);

  // 🔁 Corrigé: tenir compte des usernames pour marquer "lu"
  const markThreadAsRead = useCallback(() => {
    if (!receiver) return;
    const peerName = toName(receiverInfo?.username);
    const unreadIncoming = listMsg.filter(
      (m) =>
        !m.is_own &&
        !m.is_read &&
        // si on a les usernames, on compare au peer courant
        (m.sender_username
          ? sameName(m.sender_username, peerName)
          // fallback ancien schéma id
          : m.sender === receiver)
    );
    unreadIncoming.forEach((m) =>
      sendWS({ type: "message_read", message_id: m.id })
    );
  }, [listMsg, receiver, receiverInfo?.username, sendWS]);

  useEffect(() => {
    markThreadAsRead();
  }, [markThreadAsRead]);

  const handleReceiverSelect = (user) => {
    const exist = conversations.some((c) => c.id === user.id);
    setReceiver(user.id);
    setReceiverInfo(user);
    setShowAllUsers(false);

    if (!exist)
      setConversations([
        ...conversations,
        { ...user, last_message: "", last_message_not_lu: "0" },
      ]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !receiver) return;

    const messageData = {
      type: "chat_message",
      message: messageInput.trim(),
      sender_id: currentUser.id,
      receiver_id: receiver,
    };
    setMessageInput("");
    sendWS(messageData);
  };

  const getDisplayName = (user) =>
    user?.citoyen_profile
      ? `${user.citoyen_profile.prenom} ${user.citoyen_profile.nom}`
      : user?.association_profile
      ? user.association_profile.nom
      : user?.username || "";

  

  const connectionBadge = (status) => {
    switch (status) {
      case "Connecté":
        return "bg-emerald-100 text-emerald-700 ring-emerald-200";
      case "Authentification...":
      case "Connexion en cours...":
        return "bg-amber-100 text-amber-700 ring-amber-200";
      default:
        return "bg-rose-100 text-rose-700 ring-rose-200";
    }
  };

  

  const formatMessageTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed top-25 h-[calc(90vh-4rem)] w-[70%] text-gray-900 flex border-2 border-gray-200 rounded-[22px] overflow-hidden shadow-xl">
      <ToastContainer />

      {/* SIDEBAR */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-80 lg:w-96 shrink-0 border-r-2 border-gray-200 bg-white flex flex-col rounded-l-[22px]"
      >
        {/* Header sidebar */}
        <div className="px-6 py-4 border-b-2 border-gray-200 sticky top-0 bg-white z-10 flex items-center justify-between rounded-tl-[22px]">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm font-bold rounded-full bg-blue-400 text-white"
              >
                <Bell size={16} />
                {unreadCount}
              </motion.span>
            )}
          </div>
          <button
            className="inline-flex items-center justify-center rounded-xl border-2 border-gray-300 px-3 py-2 hover:bg-blue-400 hover:text-white hover:border-blue-400 active:scale-95 transition-all duration-200"
            onClick={() => setShowAllUsers((v) => !v)}
          >
            {showAllUsers ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>

        {/* Conversations / Users */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence>
            {!showAllUsers ? (
              conversations.length > 0 ? (
                conversations.map((conv) => {
                  const isActive = receiver === conv.id;
                  const unread = Number(conv.last_message_not_lu || "0");
                  return (
                    <motion.button
                      key={conv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => handleReceiverSelect(conv)}
                      className={[
                        "w-full flex items-center gap-4 rounded-[18px] px-4 py-3 mb-2 text-left transition-all duration-200",
                        "hover:bg-blue-50 hover:border-2 hover:border-blue-100 active:scale-[0.98]",
                        isActive
                          ? "bg-blue-400 text-white border-2 border-blue-500 shadow-lg"
                          : "bg-white border-2 border-gray-100",
                      ].join(" ")}
                    >
                      <div className={`h-12 w-12 rounded-full grid place-items-center font-bold text-lg shadow-inner ${
                        isActive 
                          ? "bg-white text-blue-400" 
                          : "bg-blue-400 text-white"
                      }`}>
                        {getDisplayName(conv).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold truncate text-base ${
                          isActive ? "text-white" : "text-gray-900"
                        }`}>
                          {getDisplayName(conv)}
                        </p>
                        <p className={`text-sm truncate ${
                          isActive ? "text-blue-100" : "text-gray-600"
                        }`}>
                          {conv.last_message || "Aucun message…"}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className={`ml-auto rounded-full text-sm font-bold h-6 min-w-[24px] px-2 grid place-items-center shadow ${
                          isActive 
                            ? "bg-white text-blue-400" 
                            : "bg-blue-400 text-white"
                        }`}>
                          {unread}
                        </span>
                      )}
                    </motion.button>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-gray-600 font-medium">Aucune conversation</p>
                </div>
              )
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-[18px] border-2 border-gray-300 px-4 py-3 text-base mb-4 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                />
                {users
                  .filter((u) =>
                    getDisplayName(u).toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((user) => (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => handleReceiverSelect(user)}
                      className="w-full flex items-center gap-4 rounded-[18px] px-4 py-3 mb-2 hover:bg-blue-50 hover:border-2 hover:border-blue-100 transition-all duration-200 border-2 border-gray-100"
                    >
                      <div className="h-12 w-12 rounded-full bg-blue-400 grid place-items-center font-bold text-white text-lg">
                        {getDisplayName(user).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate text-gray-900">{getDisplayName(user)}</p>
                        <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                      </div>
                    </motion.button>
                  ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* MAIN CHAT */}
      <main className="flex-1 flex flex-col bg-white rounded-r-[22px]">
        {receiver ? (
          <>
            {/* Header chat */}
            <div className="px-6 py-4 border-b-2 border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-center rounded-tr-[22px]">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 rounded-full bg-blue-400 text-white grid place-items-center font-bold text-lg ring-2 ring-blue-300">
                  {getDisplayName(receiverInfo).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate text-lg">{getDisplayName(receiverInfo)}</p>
                  <p className="text-sm text-gray-600 truncate">@{receiverInfo?.username}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-gradient-to-b from-gray-50 to-white space-y-4">
              <AnimatePresence>
                {listMsg.map((msg) => {
                  const isOwn = msg.is_own;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={[
                          "max-w-[75%] rounded-[22px] px-4 py-3 text-base shadow-lg transition-all duration-200",
                          isOwn
                            ? "bg-blue-400 text-white rounded-br-md"
                            : "bg-white border-2 border-gray-200 rounded-bl-md",
                        ].join(" ")}
                      >
                        <p className="leading-relaxed">{msg.contenu}</p>
                        <div
                          className={`mt-2 flex items-center gap-2 text-xs ${
                            isOwn ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          <span>{formatMessageTime(msg.date_envoi)}</span>
                          {isOwn && (
                            <span className="ml-1">
                              {msg.is_read ? (
                                <CheckCheck size={16} className="inline-block" />
                              ) : (
                                "✓"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="border-t-2 border-gray-200 bg-white px-4 py-4 rounded-br-[22px]">
              <div className="flex items-end gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Saisissez votre message…"
                  disabled={!isWebSocketConnected}
                  className="flex-1 rounded-[18px] border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.9 }}
                  disabled={!isWebSocketConnected || !messageInput.trim()}
                  className="rounded-[18px] bg-blue-400 text-white px-6 py-3 text-base font-bold hover:bg-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg"
                >
                  Envoyer
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 grid place-items-center rounded-r-[22px] bg-gradient-to-br from-gray-50 to-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto h-16 w-16 rounded-2xl grid place-items-center bg-blue-400 text-white text-3xl mb-4 shadow-lg">
                💬
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">SolidarLink Chat</h3>
              <p className="text-gray-600 font-medium">
                Sélectionnez une conversation ou démarrez-en une nouvelle
              </p>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
