import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./style/chat.css";
import { useLocation } from "react-router-dom";

function Chat() {
  const [users, setUsers] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [listMsg, setListMsg] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Déconnecté");

  const socketRef = useRef(null);
  const authDoneRef = useRef(false);
  const pendingMessagesRef = useRef([]);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const locationUser = location.state?.user || null;

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (locationUser != null) {
      setReceiver(locationUser.id);
      setReceiverInfo(locationUser);
      setListMsg([]);
    }
  }, [locationUser]);

  // Fetch all users except current user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://127.0.0.1:8000/api/users/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.filter((u) => u.id !== currentUser.id));
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des utilisateurs:", err);
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUser.id, token]);

  // Fetch message history when receiver changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiver) return;

      try {
        setLoading(true);
        const res = await axios.get(
          `http://127.0.0.1:8000/api/messagess/${receiver}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setListMsg(
          res.data.map((msg) => ({
            ...msg,
            is_own: msg.sender.id === currentUser.id,
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des messages:", err);
        setLoading(false);
      }
    };
    fetchMessages();
  }, [receiver, currentUser.id, token]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [listMsg]);

  // WebSocket connection management
  useEffect(() => {
    if (!receiver) return;

    const wsProtocol =
      window.location.protocol === "https:" ? "wss://" : "ws://";
    const socketUrl = `${wsProtocol}127.0.0.1:8000/ws/chat/${currentUser.id}/${receiver}/`;

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setConnectionStatus("Connexion en cours...");
    socketRef.current = new WebSocket(socketUrl);

    const handleOpen = () => {
      setConnectionStatus("Authentification...");
      setIsWebSocketConnected(true);
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "authentication",
            token,
          })
        );
      }
    };

    const handleMessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "authentication") {
        if (data.status === "success") {
          setConnectionStatus("Connecté");
          authDoneRef.current = true;
          // Send any pending messages
          pendingMessagesRef.current.forEach((msg) => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify(msg));
            }
          });
          pendingMessagesRef.current = [];
        } else {
          setConnectionStatus("Erreur d'authentification");
        }
      } else if (data.type === "chat_message") {
        setListMsg((prev) => [
          ...prev,
          {
            id: data.message_id,
            sender: { id: data.sender_id },
            receiver: { id: data.receiver_id },
            contenu: data.message,
            date_envoi: data.timestamp,
            is_own: data.sender_id === currentUser.id,
          },
        ]);
      }
    };

    const handleError = (e) => {
      console.error("WebSocket error:", e);
      setConnectionStatus("Erreur de connexion");
      setIsWebSocketConnected(false);
    };

    const handleClose = () => {
      console.log("WebSocket closed");
      setConnectionStatus("Déconnecté");
      setIsWebSocketConnected(false);
      socketRef.current = null;
      authDoneRef.current = false;

      // Tentative de reconnexion après 5 secondes
      setTimeout(() => {
        if (receiver) {
          setConnectionStatus("Reconnexion...");
          // Cela va déclencher à nouveau ce useEffect
          setReceiver((prev) => prev); // Force le re-render avec la même valeur
        }
      }, 5000);
    };

    socketRef.current.addEventListener("open", handleOpen);
    socketRef.current.addEventListener("message", handleMessage);
    socketRef.current.addEventListener("error", handleError);
    socketRef.current.addEventListener("close", handleClose);

    return () => {
      if (socketRef.current) {
        socketRef.current.removeEventListener("open", handleOpen);
        socketRef.current.removeEventListener("message", handleMessage);
        socketRef.current.removeEventListener("error", handleError);
        socketRef.current.removeEventListener("close", handleClose);

        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
        }
      }
    };
  }, [receiver, currentUser.id, token]);

  const handleReceiverSelect = async (user) => {
    setReceiver(user.id);
    setReceiverInfo(user);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !receiver) return;

    const messageData = {
      type: "chat_message",
      message: messageInput,
      sender_id: currentUser.id,
      receiver_id: receiver,
    };

    // Create temporary message for immediate UI feedback
    const tempMsg = {
      id: Date.now(), // temporary ID
      contenu: messageInput,
      sender: { id: currentUser.id },
      receiver: { id: receiver },
      date_envoi: new Date().toISOString(),
      is_own: true,
    };
    setMessageInput("");

    // Try to send via WebSocket
    if (
      socketRef.current?.readyState === WebSocket.OPEN &&
      authDoneRef.current
    ) {
      try {
        socketRef.current.send(JSON.stringify(messageData));
      } catch (err) {
        console.error("Erreur d'envoi WebSocket:", err);
        pendingMessagesRef.current.push(messageData);
      }
    } else {
      pendingMessagesRef.current.push(messageData);
      console.log("WebSocket non prêt, message mis en attente");
    }
  };

  return (
    <div className="chat-container">
      <div className="user-list">
        <h2>Utilisateurs</h2>
        {loading && users.length === 0 ? (
          <p>Chargement des utilisateurs...</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li
                key={user.id}
                className={receiver === user.id ? "active" : ""}
                onClick={() => handleReceiverSelect(user)}
              >
                {user.username}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chat-area">
        {receiver ? (
          <>
            <div className="chat-header">
              <h2>Discussion avec {receiverInfo?.username || receiverInfo?.nom}</h2>
              <div
                className={`connection-status ${
                  isWebSocketConnected ? "connected" : "disconnected"
                }`}
              ></div>
            </div>

            <div className="messages-container">
              {loading && listMsg.length === 0 ? (
                <p>Chargement des messages...</p>
              ) : (
                <>
                  {listMsg.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${msg.is_own ? "sent" : "received"}`}
                    >
                      <p>{msg.contenu}</p>
                      <small>
                        {new Date(msg.date_envoi).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Tapez votre message..."
                disabled={!isWebSocketConnected}
              />
              <button
                type="submit"
                disabled={!isWebSocketConnected || !messageInput.trim()}
              >
                Envoyer
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <p>Sélectionnez un utilisateur pour commencer à discuter</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
