import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import axios from "axios";
import "./style/Header.css";

export default function HeaderAssociation() {
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  // --- Récupération des messages non lus ---
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser?.id) return;
      try {
        const res = await axios.get(
          "http://127.0.0.1:8000/api/my/",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const conversationsWithUnread = await Promise.all(
          res.data.map(async (conv) => {
            try {
              const res2 = await axios.get(
                `http://127.0.0.1:8000/api/last-message-not-lu/${conv.id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return parseInt(res2.data.nb_msg || "0");
            } catch {
              return 0;
            }
          })
        );

        const totalUnread = conversationsWithUnread.reduce((a, b) => a + b, 0);
        setUnreadCount(totalUnread);
      } catch (err) {
        console.error("Erreur récupération messages non lus:", err);
      }
    };

    fetchUnreadCount();
  }, [currentUser?.id, token]);

  // --- WebSocket notifications ---
  useEffect(() => {
    if (!currentUser?.id) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const notificationUrl = `${wsProtocol}127.0.0.1:8000/ws/notifications/${currentUser.id}/`;

    const notificationWs = new WebSocket(notificationUrl);

    const handleNotificationMessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "notification") {
          setUnreadCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Erreur WebSocket notifications:", err);
      }
    };

    notificationWs.addEventListener("message", handleNotificationMessage);

    return () => {
      notificationWs.removeEventListener("message", handleNotificationMessage);
      try { notificationWs.close(); } catch {}
    };
  }, [currentUser?.id]);

  return (
    <header className="app-header simple-header">
      {/* Logo */}
      <Link to="/welcome/association" className="brand">
        <span className="brand-badge">S</span>
        <span className="brand-name">SolidarLink</span>
      </Link>

      {/* Messagerie */}
      <div className="header-right">
        <Link to="/welcome/association/chat" className="header-icon messages">
          <MessageCircle size={24} />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </Link>
      </div>
    </header>
  );
}
