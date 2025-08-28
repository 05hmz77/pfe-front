// Chat.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./style/chat.css";
import { useLocation } from "react-router-dom";
import { Plus, X, CheckCheck } from "lucide-react";

export default function Chat() {
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

  const socketRef = useRef(null);
  const authDoneRef = useRef(false);
  const pendingOutboxRef = useRef([]);
  const pendingReadsRef = useRef([]);
  const messagesEndRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const location = useLocation();
  const locationUser = location.state?.user || null;

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  // --- helpers ---
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

  // Pré-sélection receiver depuis navigation state
  useEffect(() => {
    if (locationUser != null) {
      setReceiver(locationUser.id);
      setReceiverInfo(locationUser);
      setListMsg([]);
    }
  }, [locationUser]);

  // Notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Récupérer users et conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const usersRes = await axios.get("http://127.0.0.1:8000/api/userss/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const conversationsRes = await axios.get(
          "http://127.0.0.1:8000/api/my/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setUsers(usersRes.data.filter((u) => u.id !== currentUser.id));

        // Injecte le dernier message et compteur non lu
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
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser.id, token]);

  // Récupérer historique messages
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

  // WS connection
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

    const handleOpen = () => {
      setIsWebSocketConnected(true);
      setConnectionStatus("Authentification...");
      ws.send(JSON.stringify({ type: "authentication", token }));
    };

    const flushQueues = () => {
      if (!wsReady()) return;
      while (pendingOutboxRef.current.length) {
        ws.send(JSON.stringify(pendingOutboxRef.current.shift()));
      }
      while (pendingReadsRef.current.length) {
        ws.send(JSON.stringify(pendingReadsRef.current.shift()));
      }
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
        alert("ha msg ja")
        // Ajouter le message à la liste
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
        ],alert(1));

        // Mettre à jour le dernier message et compteur non lu
        setConversations((prev) =>
          prev.map((c) => {
            const isConv =
              c.id === data.sender_id || c.id === data.receiver_id;
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

        // Marquer comme lu si conversation ouverte
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
          prev.map((c) =>
            c.id === receiver ? { ...c, last_message_not_lu: "0" } : c
          )
        );
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
  }, [receiver, currentUser.id, token]);

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
    if (user.citoyen_profile) {
      return `${user.citoyen_profile.prenom} ${user.citoyen_profile.nom}`;
    } else if (user.association_profile) {
      return user.association_profile.nom;
    } else {
      return user.username;
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="pulse-chat-container">
      {/* SIDEBAR */}
      <div className="pulse-sidebar">
        <div className="pulse-sidebar-header">
          <h2>Messages</h2>
          {showAllUsers ? (
            <button
              className="pulse-add-user-btn"
              onClick={() => setShowAllUsers(!showAllUsers)}
            >
              <X size={20} />
            </button>
          ) : (
            <button
              className="pulse-add-user-btn"
              onClick={() => setShowAllUsers(!showAllUsers)}
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {!showAllUsers ? (
          <div className="pulse-conversation-list">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`pulse-conversation-item ${
                    receiver === conv.id ? "pulse-active" : ""
                  }`}
                  onClick={() => handleReceiverSelect(conv)}
                >
                  <div className="pulse-avatar">
                    {getDisplayName(conv).charAt(0).toUpperCase()}
                  </div>
                  <div className="pulse-conversation-info">
                    <div className="pulse-conversation-name">
                      {getDisplayName(conv)}
                    </div>
                    <div className="pulse-conversation-preview">
                      {conv.last_message || "Aucun message..."}
                    </div>
                    <div className="pulse-conversation-not-lu">
                      {conv.last_message_not_lu}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="pulse-no-conversations">Aucune conversation</p>
            )}
          </div>
        ) : (
          <div className="pulse-user-list">
            <div className="pulse-search-container">
              <input
                type="text"
                placeholder="Rechercher des utilisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {users.map((user) => (
              <div
                key={user.id}
                className="pulse-user-item"
                onClick={() => handleReceiverSelect(user)}
              >
                <div className="pulse-avatar">
                  {getDisplayName(user).charAt(0).toUpperCase()}
                </div>
                <div className="pulse-user-info">
                  <div className="pulse-username">{getDisplayName(user)}</div>
                  <div className="pulse-user-handle">@{user.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CHAT */}
      <div className="pulse-chat-main">
        {receiver ? (
          <>
            <div className="pulse-chat-header">
              <div className="pulse-chat-left">
                <div className="pulse-avatar">
                  {getDisplayName(receiverInfo).charAt(0).toUpperCase()}
                </div>
                <div className="pulse-chat-info">
                  <div className="pulse-chat-name">
                    {getDisplayName(receiverInfo)}
                  </div>
                  <div className="pulse-chat-username">
                    @{receiverInfo.username}
                  </div>
                </div>
              </div>

              <div className="pulse-chat-actions">
                <button
                  className="pulse-menu-btn"
                  onClick={() => setShowMenu((prev) => !prev)}
                >
                  ⋮
                </button>

                {showMenu && (
                  <div className="pulse-menu-dropdown">
                    <div className="pulse-menu-item">👤 Voir profil</div>
                    <div className="pulse-menu-item">🚫 Bloquer</div>
                    <div className="pulse-menu-item">
                      🗑️ Supprimer conversation
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pulse-messages-container">
              {listMsg.length > 0 ? (
                listMsg.map((msg) => (
                  <div
                    key={msg.id}
                    className={`pulse-message-bubble ${
                      msg.is_own ? "sent" : "received"
                    }`}
                  >
                    <p>{msg.contenu}</p>
                    <span className="pulse-message-time">
                      {formatMessageTime(msg.date_envoi)}
                      {msg.is_own && (
                        <span className={`pulse-read-status`}>
                          {msg.is_read ? <CheckCheck size={14} /> : "✓"}
                        </span>
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <p className="pulse-no-messages">
                  Aucun message pour le moment
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="pulse-message-form">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Saisissez votre message..."
                disabled={!isWebSocketConnected}
              />
              <button
                type="submit"
                disabled={!isWebSocketConnected || !messageInput.trim()}
                className="pulse-send-button"
              >
                ➤
              </button>
            </form>
          </>
        ) : (
          <div className="pulse-chat-placeholder">
            <h3>Pulse Messenger</h3>
            <p>Sélectionnez une conversation ou démarrez-en une nouvelle</p>
          </div>
        )}
      </div>
    </div>
  );
}
