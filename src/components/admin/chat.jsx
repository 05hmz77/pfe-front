// Chat.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./style/chat.css";
import { useLocation } from "react-router-dom";
import { Plus } from "lucide-react";

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [listMsg, setListMsg] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const location = useLocation();
  const locationUser = location.state?.user || null;

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  // --- helpers ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Pré-sélection receiver depuis navigation state
  useEffect(() => {
    if (locationUser != null) {
      setReceiver(locationUser.id);
      setReceiverInfo(locationUser);
      setListMsg([]);
    }
  }, [locationUser]);

  // Récupérer users et conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await axios.get("http://127.0.0.1:8000/api/userss/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const conversationsRes = await axios.get("http://127.0.0.1:8000/api/my/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(usersRes.data.filter((u) => u.id !== currentUser.id));
        setConversations(conversationsRes.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
      }
    };
    fetchData();
  }, [currentUser.id, token]);

  // Récupérer historique messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiver) return;
      try {
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
      }
    };
    fetchMessages();
  }, [receiver, currentUser.id, token]);

  useEffect(() => {
    scrollToBottom();
  }, [listMsg]);

  // sélection utilisateur
  const handleReceiverSelect = (user) => {
    setReceiver(user.id);
    setReceiverInfo(user);
    setListMsg([]);
    setShowAllUsers(false);
  };

  // envoyer un message (fake socket)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !receiver) return;

    const newMsg = {
      id: Date.now(),
      sender: currentUser.id,
      receiver: receiver,
      contenu: messageInput.trim(),
      date_envoi: new Date().toISOString(),
      is_own: true,
      is_read: false,
    };

    setListMsg((prev) => [...prev, newMsg]);
    setMessageInput("");
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.citoyen_profile && 
      `${user.citoyen_profile.prenom} ${user.citoyen_profile.nom}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.association_profile && 
      user.association_profile.nom.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDisplayName = (user) => {
    if (!user) return "";
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
          {conversations.length > 0 ? (
            conversations.map((conv) => (
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

      {/* MAIN CHAT */}
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
            </div>

            <div className="pulse-messages-container">
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
            </div>

            <form onSubmit={handleSendMessage} className="pulse-message-form">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Saisissez votre message..."
              />
              <button type="submit" className="pulse-send-button">
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