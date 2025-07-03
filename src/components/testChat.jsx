import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./chat.css";

function TestChat() {
  const [users, setUsers] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [listMsg, setListMsg] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const socketRef = useRef(null);
  const authDoneRef = useRef(false);
  const pendingMessagesRef = useRef([]);
  const messagesEndRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/users/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.filter((u) => u.id !== currentUser.id));
      } catch (err) {
        console.error("Erreur utilisateur:", err);
      }
    };
    fetchUsers();
  }, [currentUser.id]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiver) return;
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/messages/${receiver}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setListMsg(res.data);
      } catch (err) {
        console.error("Erreur messages:", err);
      }
    };
    fetchMessages();
  }, [receiver]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [listMsg]);

  useEffect(() => {
    if (!receiver) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const socketUrl = `${wsProtocol}127.0.0.1:8000/ws/chat/${currentUser.id}/${receiver}/`;

    socketRef.current = new WebSocket(socketUrl);

    socketRef.current.onopen = () => {
      authDoneRef.current = false;
      socketRef.current.send(JSON.stringify({ type: "authentication", token }));
    };

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "authentication") {
        if (data.status === "success") {
          authDoneRef.current = true;
          pendingMessagesRef.current.forEach((msg) =>
            socketRef.current.send(JSON.stringify(msg))
          );
          pendingMessagesRef.current = [];
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

    socketRef.current.onerror = (e) => console.error("WebSocket erreur:", e);
    socketRef.current.onclose = () => {
      socketRef.current = null;
      authDoneRef.current = false;
    };

    return () => {
      socketRef.current?.close();
    };
  }, [receiver]);

  const handleReceiverSelect = (user) => {
    setReceiver(user.id);
    setReceiverInfo(user);
    setListMsg([]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const msg = {
      message: messageInput,
      sender_id: currentUser.id,
      receiver_id: receiver,
    };

    const tempMsg = {
      id: Date.now(),
      contenu: messageInput,
      sender: { id: currentUser.id },
      receiver: { id: receiver },
      date_envoi: new Date().toISOString(),
      is_own: true,
    };

    if (socketRef.current?.readyState === WebSocket.OPEN && authDoneRef.current) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      pendingMessagesRef.current.push(msg);
    }

    setListMsg((prev) => [...prev, tempMsg]);
    setMessageInput("");
  };

  return (
    <div className="chat-container">
      <div className="user-list">
        <h2>Utilisateurs</h2>
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
      </div>

      <div className="chat-area">
        {receiver ? (
          <>
            <h2>Discussion avec {receiverInfo?.username}</h2>
            <div className="messages-container">
              {listMsg.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.is_own ? "sent" : "received"}`}
                >
                  <p>{msg.contenu}</p>
                  <small>{new Date(msg.date_envoi).toLocaleTimeString()}</small>
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Message..."
              />
              <button type="submit">Envoyer</button>
            </form>
          </>
        ) : (
          <p>Sélectionnez un utilisateur pour discuter</p>
        )}
      </div>
    </div>
  );
}

export default TestChat;
