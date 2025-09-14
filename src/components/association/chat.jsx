// Chat.jsx (Tailwind-only, no external CSS)
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { Plus, X, CheckCheck, Bell } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      } catch (e) {
        if (payload.type === "message_read")
          pendingReadsRef.current.push(payload);
        else pendingOutboxRef.current.push(payload);
      }
    } else {
      if (payload.type === "message_read")
        pendingReadsRef.current.push(payload);
      else pendingOutboxRef.current.push(payload);
    }
  }, []);

  // Receiver pré-sélectionné depuis navigation
  useEffect(() => {
    if (locationUser != null) {
      setReceiver(locationUser.id);
      setReceiverInfo(locationUser);
      setListMsg([]);
    }
  }, [locationUser]);

  // Permission Notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Récupération users + conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const usersRes = await axios.get("http://127.0.0.1:8000/api/userss/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const conversationsRes = await axios.get(
          "http://127.0.0.1:8000/api/my/",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsers(usersRes.data.filter((u) => u.id !== currentUser.id));

        const convsWithLastMessage = await Promise.all(
          conversationsRes.data.map(async (conv) => {
            try {
              const res = await axios.get(
                `http://127.0.0.1:8000/api/last-message/${conv.id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              const res2 = await axios.get(
                `http://127.0.0.1:8000/api/last-message-not-lu/${conv.id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              return {
                ...conv,
                last_message: res.data.contenu || "Aucun message...",
                last_message_not_lu: res2.data.nb_msg?.toString() || "0",
              };
            } catch (err) {
              console.error(err);
              return {
                ...conv,
                last_message: "Erreur...",
                last_message_not_lu: "0",
              };
            }
          })
        );

        setConversations(convsWithLastMessage);

        const totalUnread = convsWithLastMessage.reduce((total, conv) => {
          return total + parseInt(conv.last_message_not_lu || "0");
        }, 0);
        setUnreadCount(totalUnread);
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser.id, token]);

  // Récupérer l'historique de messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiver) return;
      try {
        setLoading(true);
        const res = await axios.get(
          `http://127.0.0.1:8000/api/messagess/${receiver}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setListMsg(
          res.data.map((msg) => ({
            ...msg,
            is_own: msg.sender === currentUser.id,
            is_read: msg.is_read ?? false,
          }))
        );
      } catch (err) {
        console.error("Erreur lors de la récupération des messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [receiver, currentUser.id, token]);

  useEffect(() => {
    scrollToBottom();
  }, [listMsg]);

  // Connexion WS (chat)
  useEffect(() => {
    if (!receiver) return;

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const wsProtocol =
      window.location.protocol === "https:" ? "wss://" : "ws://";
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
        // Ajouter le message
        setListMsg((prev) => [
          ...prev,
          {
            id: data.message_id,
            sender: data.sender_id,
            receiver: data.receiver_id,
            contenu: data.message,
            date_envoi: data.timestamp,
            is_own: data.sender_id === currentUser.id,
            is_read:
              data.receiver_id === currentUser.id &&
              receiver === data.sender_id,
          },
        ]);

        // MAJ dernier message + non lus
        setConversations((prev) =>
          prev.map((c) => {
            const isConv = c.id === data.sender_id || c.id === data.receiver_id;
            if (!isConv) return c;

            const unreadCount = parseInt(c.last_message_not_lu || "0");
            const newUnread =
              data.receiver_id === currentUser.id &&
              receiver !== data.sender_id
                ? unreadCount + 1
                : 0;

            return {
              ...c,
              last_message: data.message,
              last_message_not_lu: newUnread.toString(),
            };
          })
        );

        // Total non lus
        setUnreadCount((prev) => prev + 1);

        // Marquer comme lu si la conv est ouverte
        if (data.receiver_id === currentUser.id && receiver === data.sender_id) {
          sendWS({ type: "message_read", message_id: data.message_id });
        }
        return;
      }

      if (data.type === "message_read") {
        setListMsg((prev) =>
          prev.map((m) =>
            m.id === data.message_id ? { ...m, is_read: true } : m
          )
        );

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === receiver) {
              const newUnread = Math.max(
                0,
                parseInt(c.last_message_not_lu || "0") - 1
              );
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
        setReceiver((prev) => prev); // retrigger effect
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
  }, [receiver, currentUser.id, token, sendWS]);

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

    const wsProtocol =
      window.location.protocol === "https:" ? "wss://" : "ws://";
    const notificationUrl = `${wsProtocol}127.0.0.1:8000/ws/notifications/${currentUser.id}/`;

    const notificationWs = new WebSocket(notificationUrl);
    notificationSocketRef.current = notificationWs;

    const handleNotificationMessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === "notification") {
          toast.info(
            `${data.from_user || "Quelqu'un"} vous a envoyé un message: ${
              data.content
            }`,
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
          setUnreadCount((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error processing notification:", error);
      }
    };

    const scheduleNotificationReconnect = () => {
      if (notificationReconnectTimerRef.current) return;
      notificationReconnectTimerRef.current = setTimeout(() => {
        notificationReconnectTimerRef.current = null;
        // effect will re-run naturally
      }, 5000);
    };

    const handleNotificationError = () => {
      console.error("Notification WebSocket error");
    };

    const handleNotificationClose = () => {
      scheduleNotificationReconnect();
    };

    notificationWs.addEventListener("message", handleNotificationMessage);
    notificationWs.addEventListener("error", handleNotificationError);
    notificationWs.addEventListener("close", handleNotificationClose);

    return () => {
      notificationWs.removeEventListener("message", handleNotificationMessage);
      notificationWs.removeEventListener("error", handleNotificationError);
      notificationWs.removeEventListener("close", handleNotificationClose);
      try {
        notificationWs.close();
      } catch {}
    };
  }, [currentUser?.id]);

  const markThreadAsRead = useCallback(() => {
    if (!receiver) return;
    const unreadIncoming = listMsg.filter(
      (m) => !m.is_own && !m.is_read && m.sender === receiver
    );
    unreadIncoming.forEach((m) =>
      sendWS({ type: "message_read", message_id: m.id })
    );
  }, [listMsg, receiver, sendWS]);

  useEffect(() => {
    markThreadAsRead();
  }, [markThreadAsRead]);

  const handleReceiverSelect = (user) => {
    const exist = conversations.some((c) => c.id === user.id);

    setReceiver(user.id);
    setReceiverInfo(user);
    setShowAllUsers(false);

    // Reset non lus pour la conv affichée
    setConversations((prev) =>
      prev.map((c) =>
        c.id === user.id ? { ...c, last_message_not_lu: "0" } : c
      )
    );
    markThreadAsRead();

    if (!exist) {
      setListMsg([]);
      setConversations([
        ...conversations,
        { ...user, last_message: "", last_message_not_lu: "0" },
      ]);
    }
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

  const getDisplayName = (user) => {
    if (!user) return "";
    if (user.citoyen_profile) {
      return `${user.citoyen_profile.prenom} ${user.citoyen_profile.nom}`;
    } else if (user.association_profile) {
      return user.association_profile.nom;
    } else {
      return user.username || "";
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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

  const filteredUsers = users.filter((u) =>
    getDisplayName(u).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-900 flex">
      <ToastContainer />

      {/* SIDEBAR */}
      <aside className="w-[320px] shrink-0 border-r bg-white flex flex-col">
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b sticky top-0 bg-white/90 backdrop-blur z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Messages {x}</h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                <Bell size={14} />
                {unreadCount}
              </span>
            )}
          </div>
          <button
            className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 hover:bg-gray-50"
            onClick={() => setShowAllUsers((v) => !v)}
            title={showAllUsers ? "Fermer" : "Nouveau message"}
          >
            {showAllUsers ? <X size={18} /> : <Plus size={18} />}
          </button>
        </div>

        {/* Toggle area: Conversations or Users */}
        {!showAllUsers ? (
          <>
            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loading && conversations.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Chargement...</div>
              ) : conversations.length > 0 ? (
                <ul className="p-2">
                  {conversations.map((conv) => {
                    const isActive = receiver === conv.id;
                    const unread = parseInt(conv.last_message_not_lu || "0");
                    return (
                      <li key={conv.id}>
                        <button
                          onClick={() => handleReceiverSelect(conv)}
                          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gray-50 ${
                            isActive ? "bg-gray-100" : ""
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-gray-200 grid place-items-center font-semibold">
                            {getDisplayName(conv).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {getDisplayName(conv)}
                              </p>
                              {unread > 0 && (
                                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs h-5 min-w-[20px] px-1">
                                  {unread}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {conv.last_message || "Aucun message..."}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="p-4 text-sm text-gray-500">
                  Aucune conversation pour le moment.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Users picker */}
            <div className="p-3 border-b">
              <input
                type="text"
                placeholder="Rechercher des utilisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                <ul className="p-2">
                  {filteredUsers.map((user) => (
                    <li key={user.id}>
                      <button
                        onClick={() => handleReceiverSelect(user)}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gray-50"
                      >
                        <div className="h-10 w-10 rounded-full bg-gray-200 grid place-items-center font-semibold">
                          {getDisplayName(user).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {getDisplayName(user)}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            @{user.username}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-4 text-sm text-gray-500">Aucun résultat.</p>
              )}
            </div>
          </>
        )}
      </aside>

      {/* MAIN CHAT */}
      <main className="flex-1 flex flex-col">
        {receiver ? (
          <>
            {/* Header main chat */}
            <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 grid place-items-center font-semibold">
                    {getDisplayName(receiverInfo).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {getDisplayName(receiverInfo)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{receiverInfo?.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${connectionBadge(
                      connectionStatus
                    )}`}
                  >
                    {connectionStatus}
                  </span>

                  <div className="relative">
                    <button
                      className="rounded-lg border px-2.5 py-1.5 hover:bg-gray-50"
                      onClick={() => setShowMenu((prev) => !prev)}
                    >
                      ⋮
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg overflow-hidden z-20">
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                          👤 Voir profil
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                          🚫 Bloquer
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                          🗑️ Supprimer conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-gray-50 to-white">
              {listMsg.length > 0 ? (
                <ul className="space-y-2">
                  {listMsg.map((msg) => {
                    const isOwn = msg.is_own;
                    return (
                      <li
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-3 py-2 shadow-sm text-sm ${
                            isOwn
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white text-gray-900 border rounded-bl-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.contenu}
                          </p>
                          <div
                            className={`mt-1 flex items-center gap-1 text-[11px] ${
                              isOwn ? "text-blue-100/90" : "text-gray-500"
                            }`}
                          >
                            <span>{formatMessageTime(msg.date_envoi)}</span>
                            {isOwn && (
                              <span className="ml-1">
                                {msg.is_read ? (
                                  <CheckCheck
                                    size={14}
                                    className="inline-block align-[-2px]"
                                  />
                                ) : (
                                  "✓"
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="h-full grid place-items-center text-sm text-gray-500">
                  Aucun message pour le moment
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <form
              onSubmit={handleSendMessage}
              className="border-t bg-white px-3 py-2"
            >
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Saisissez votre message..."
                  disabled={!isWebSocketConnected}
                  className="flex-1 rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={!isWebSocketConnected || !messageInput.trim()}
                  className="rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  Envoyer
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 grid place-items-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl grid place-items-center bg-gray-100 border">
                💬
              </div>
              <h3 className="mt-3 text-lg font-semibold">Pulse Messenger</h3>
              <p className="text-sm text-gray-600">
                Sélectionnez une conversation ou démarrez-en une nouvelle
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
