// Chat.jsx — Tailwind only
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

        const usersRes = await axios.get("http://127.0.0.1:8000/api/userss/", {
          headers,
        });
        const conversationsRes = await axios.get("http://127.0.0.1:8000/api/my/", {
          headers,
        });

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

  // Historique messages d'un receiver
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [receiver, currentUser.id, token]);

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
              data.receiver_id === currentUser.id && receiver === data.sender_id,
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

  const formatMessageTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

  return (
    <div className="h-[100svh] md:h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900 flex overflow-hidden">
      <ToastContainer />

      {/* SIDEBAR */}
      <aside className="w-80 lg:w-96 shrink-0 border-r bg-white/80 backdrop-blur-sm flex flex-col">
        {/* Header sidebar */}
        <div className="px-4 py-3 border-b sticky top-0 bg-white/70 backdrop-blur z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Messages {x}</h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200">
                <Bell size={14} />
                {unreadCount}
              </span>
            )}
          </div>
          <button
            className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 hover:bg-gray-50 active:scale-95 transition"
            onClick={() => setShowAllUsers((v) => !v)}
            title={showAllUsers ? "Fermer" : "Nouveau message"}
          >
            {showAllUsers ? <X size={18} /> : <Plus size={18} />}
          </button>
        </div>

        {/* Conversations OR Users (scroll area) */}
        {!showAllUsers ? (
          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Chargement…</div>
            ) : conversations.length > 0 ? (
              <ul className="p-2 space-y-1">
                {conversations.map((conv) => {
                  const isActive = receiver === conv.id;
                  const unread = Number(conv.last_message_not_lu || "0");
                  const avatarImg =
                    conv.citoyen_profile?.album_photos
                      ? `http://localhost:8000/media/${JSON.parse(conv.citoyen_profile.album_photos)[0]}`
                      : conv.association_profile?.logo
                      ? `http://localhost:8000/media/${conv.association_profile.logo}`
                      : null;

                  return (
                    <li key={conv.id}>
                      <button
                        onClick={() => handleReceiverSelect(conv)}
                        className={[
                          "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                          "hover:bg-gray-50 active:scale-[0.995]",
                          isActive ? "bg-gray-100 ring-1 ring-inset ring-gray-200 shadow-sm" : "",
                        ].join(" ")}
                      >
                        <div className="h-10 w-10 rounded-full ring-1 ring-inset ring-slate-200 overflow-hidden grid place-items-center font-semibold bg-slate-100 text-slate-700">
                          {avatarImg ? (
                            <img
                              src={avatarImg}
                              alt="avatar"
                              className="h-full w-full object-cover"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          ) : (
                            getDisplayName(conv).charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{getDisplayName(conv)}</p>
                            {unread > 0 && (
                              <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs h-5 min-w-[20px] px-1 shadow">
                                {unread}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {conv.last_message || "Aucun message…"}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-4 text-sm text-gray-500">Aucune conversation</p>
            )}
          </div>
        ) : (
          <>
            <div className="p-3 border-b sticky top-[49px] bg-white/70 backdrop-blur z-10">
              <input
                type="text"
                placeholder="Rechercher des utilisateurs…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <ul className="p-2 space-y-1">
                {users
                  .filter((u) =>
                    getDisplayName(u).toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((user) => {
                    const avatarImg =
                      user.citoyen_profile?.album_photos
                        ? `http://localhost:8000/media/${JSON.parse(user.citoyen_profile.album_photos)[0]}`
                        : user.association_profile?.logo
                        ? `http://localhost:8000/media/${user.association_profile.logo}`
                        : null;

                    return (
                      <li key={user.id}>
                        <button
                          onClick={() => handleReceiverSelect(user)}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gray-50 active:scale-[0.995] transition"
                        >
                          <div className="h-10 w-10 rounded-full ring-1 ring-inset ring-slate-200 overflow-hidden grid place-items-center font-semibold bg-slate-100 text-slate-700">
                            {avatarImg ? (
                              <img
                                src={avatarImg}
                                alt="avatar"
                                className="h-full w-full object-cover"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            ) : (
                              getDisplayName(user).charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{getDisplayName(user)}</p>
                            <p className="text-xs text-gray-600 truncate">@{user.username}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </>
        )}
      </aside>

      {/* MAIN CHAT */}
      <main className="flex-1 flex flex-col bg-white/60 backdrop-blur-sm">
        {receiver ? (
          <>
            {/* Header chat (sticky) */}
            <div className="px-4 py-3 border-b bg-white/70 backdrop-blur sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full grid place-items-center font-semibold bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 ring-1 ring-inset ring-purple-200">
                    {getDisplayName(receiverInfo).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{getDisplayName(receiverInfo)}</p>
                    <p className="text-xs text-gray-500 truncate">@{receiverInfo?.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${connectionBadge(
                      connectionStatus
                    )}`}
                  >
                    <span
                      className={[
                        "mr-1 inline-block h-2 w-2 rounded-full",
                        connectionStatus === "Connecté"
                          ? "bg-emerald-500"
                          : connectionStatus.includes("Connexion")
                          ? "bg-amber-500"
                          : "bg-rose-500",
                      ].join(" ")}
                    />
                    {connectionStatus}
                  </span>

                  <div className="relative">
                    <button
                      className="rounded-lg border px-2.5 py-1.5 hover:bg-gray-50 active:scale-95 transition"
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

            {/* Messages (scroll area) */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-slate-50/60 to-white">
              {listMsg.length > 0 ? (
                <ul className="space-y-2">
                  {listMsg.map((msg) => {
                    const isOwn = msg.is_own;
                    return (
                      <li
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} transition`}
                      >
                        <div
                          className={[
                            "max-w-[70%] rounded-2xl px-3 py-2 shadow-sm text-sm transition",
                            "hover:translate-y-[-1px] hover:shadow",
                            isOwn
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white text-gray-900 border rounded-bl-sm",
                          ].join(" ")}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.contenu}</p>
                          <div
                            className={`mt-1 flex items-center gap-1 text-[11px] ${
                              isOwn ? "text-blue-100/90" : "text-gray-500"
                            }`}
                          >
                            <span>{formatMessageTime(msg.date_envoi)}</span>
                            {isOwn && (
                              <span className="ml-1">
                                {msg.is_read ? (
                                  <CheckCheck size={14} className="inline-block align-[-2px]" />
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

            {/* Composer (fixe en bas) */}
            <form onSubmit={handleSendMessage} className="border-t bg-white px-3 py-2">
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Saisissez votre message…"
                  disabled={!isWebSocketConnected}
                  className="flex-1 rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition"
                />
                <button
                  type="submit"
                  disabled={!isWebSocketConnected || !messageInput.trim()}
                  className="rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 active:scale-95 transition disabled:opacity-60"
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
