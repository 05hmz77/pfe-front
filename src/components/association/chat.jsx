// Chat.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./style/chat.css";
import { useLocation } from "react-router-dom";

export default function Chat() {
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
        if (payload.type === "message_read") pendingReadsRef.current.push(payload);
        else pendingOutboxRef.current.push(payload);
      }
    } else {
      if (payload.type === "message_read") pendingReadsRef.current.push(payload);
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

  // Permission Notifications (une fois)
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
        
        // Récupérer tous les utilisateurs
        const usersRes = await axios.get("http://127.0.0.1:8000/api/userss/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Récupérer les conversations existantes
        const conversationsRes = await axios.get("http://127.0.0.1:8000/api/my/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setUsers(usersRes.data.filter((u) => u.id !== currentUser.id));
        setConversations(conversationsRes.data);
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

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [listMsg]);

  // WS : open connection when receiver changes
  useEffect(() => {
    if (!receiver) return;

    // Clean previous
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

    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const socketUrl = `${wsProtocol}127.0.0.1:8000/ws/chat/${currentUser.id}/${receiver}/`;

    setConnectionStatus("Connexion en cours...");
    const ws = new WebSocket(socketUrl);
    socketRef.current = ws;

    const handleOpen = () => {
      setIsWebSocketConnected(true);
      setConnectionStatus("Authentification...");
      // Authentifier
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
        setListMsg((prev) => {
          const next = [
            ...prev,
            {
              id: data.message_id,
              sender: data.sender_id,
              receiver: data.receiver_id,
              contenu: data.message,
              date_envoi: data.timestamp,
              is_own: data.sender_id === currentUser.id,
              is_read: data.is_read ?? false,
            },
          ];

          if (
            data.receiver_id === currentUser.id &&
            data.sender_id !== currentUser.id &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(
                `${receiverInfo?.username || "Nouveau message"}`,
                { body: data.message }
              );
            } catch {}
          }

          return next;
        });

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
        return;
      }

      if (data.type === "error") {
        console.warn("WS error:", data.message);
      }
    };

    const handleError = (e) => {
      console.error("WebSocket error:", e);
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

  // Marquer les messages reçus non lus de ce thread comme lus
  const markThreadAsRead = useCallback(() => {
    if (!receiver) return;
    const unreadIncoming = listMsg.filter(
      (m) => !m.is_own && !m.is_read && m.sender === receiver
    );
    unreadIncoming.forEach((m) =>
      sendWS({ type: "message_read", message_id: m.id })
    );
  }, [listMsg, receiver, sendWS]);

  // Marquer lus quand on change de receiver ou quand la liste change
  useEffect(() => {
    markThreadAsRead();
  }, [markThreadAsRead]);

  // Marquer lus quand la fenêtre reprend le focus
  useEffect(() => {
    const onFocus = () => markThreadAsRead();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [markThreadAsRead]);

  const handleReceiverSelect = (user) => {
    setReceiver(user.id);
    setReceiverInfo(user);
    setListMsg([]);
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

  // Filtrer les utilisateurs/conversations selon le terme de recherche
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.citoyen_profile && 
      `${user.citoyen_profile.prenom} ${user.citoyen_profile.nom}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.association_profile && 
      user.association_profile.nom.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredConversations = conversations.filter(conv => 
    conv.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.citoyen_profile && 
      `${conv.citoyen_profile.prenom} ${conv.citoyen_profile.nom}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (conv.association_profile && 
      conv.association_profile.nom.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtenir le nom d'affichage d'un utilisateur
  const getDisplayName = (user) => {
    if (user.citoyen_profile) {
      return `${user.citoyen_profile.prenom} ${user.citoyen_profile.nom}`;
    } else if (user.association_profile) {
      return user.association_profile.nom;
    } else {
      return user.username;
    }
  };

  // Formater la date pour l'affichage
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="pulse-chat-container">
      <div className="pulse-sidebar">
        <div className="pulse-sidebar-header">
          <h2>Messages</h2>
          <div className="pulse-search-container">
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="pulse-conversation-list">
          {loading && conversations.length === 0 ? (
            <p className="pulse-loading">Chargement des conversations...</p>
          ) : (
            <>
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`pulse-conversation-item ${receiver === conv.id ? "pulse-active" : ""}`}
                    onClick={() => handleReceiverSelect(conv)}
                  >
                    <div className="pulse-avatar">
                      {getDisplayName(conv).charAt(0).toUpperCase()}
                    </div>
                    <div className="pulse-conversation-info">
                      <div className="pulse-conversation-name">{getDisplayName(conv)}</div>
                      <div className="pulse-conversation-preview">Aucun message...</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="pulse-no-conversations">Aucune conversation</p>
              )}
            </>
          )}
        </div>

        <div className="pulse-new-chat-section">
          <h3>Nouvelle conversation</h3>
          <div className="pulse-search-container">
            <input 
              type="text" 
              placeholder="Rechercher des utilisateurs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="pulse-user-list">
            {filteredUsers.map((user) => (
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
        </div>
      </div>

      <div className="pulse-chat-main">
        {receiver ? (
          <>
            <div className="pulse-chat-header">
              <div className="pulse-chat-partner">
                <div className="pulse-avatar">
                  {getDisplayName(receiverInfo).charAt(0).toUpperCase()}
                </div>
                <div className="pulse-chat-info">
                  <div className="pulse-chat-name">{getDisplayName(receiverInfo)}</div>
                  <div className="pulse-chat-status">
                    <span className={`pulse-status-indicator ${isWebSocketConnected ? "pulse-online" : "pulse-offline"}`}></span>
                    {isWebSocketConnected ? "En ligne" : "Hors ligne"}
                  </div>
                </div>
              </div>
              <div className="pulse-connection-status" title={connectionStatus}>
                <span className={`pulse-status-dot ${isWebSocketConnected ? "pulse-connected" : "pulse-disconnected"}`}></span>
              </div>
            </div>

            <div className="pulse-messages-container">
              {loading && listMsg.length === 0 ? (
                <p className="pulse-loading">Chargement des messages...</p>
              ) : (
                <>
                  {listMsg.length > 0 ? (
                    listMsg.map((msg) => (
                      <div
                        key={msg.id}
                        className={`pulse-message ${msg.is_own ? "pulse-sent" : "pulse-received"}`}
                      >
                        <div className="pulse-message-content">
                          <p>{msg.contenu}</p>
                          <div className="pulse-message-meta">
                            <span className="pulse-message-time">
                              {formatMessageTime(msg.date_envoi)}
                            </span>
                            {msg.is_own && (
                              <span className="pulse-message-status" title={msg.is_read ? "Vu" : "Envoyé"}>
                                {msg.is_read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pulse-no-messages">
                      <p>Aucun message échangé pour le moment</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
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
                Envoyer
              </button>
            </form>
          </>
        ) : (
          <div className="pulse-chat-placeholder">
            <div className="pulse-placeholder-content">
              <h3>Pulse Messenger</h3>
              <p>Sélectionnez une conversation ou démarrez-en une nouvelle</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}