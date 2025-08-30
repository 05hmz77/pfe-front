import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, MessageCircle } from "lucide-react";
import axios from "axios";
import "./style/Header.css";

export default function Header({ isSidebarOpen, onToggleSidebar }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  // --- Fetch initial unread count ---
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser?.id) return;
      try {
        const res = await axios.get(
          "http://127.0.0.1:8000/api/my/", // endpoint pour récupérer les conversations
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
    <header className={`app-header ${isSidebarOpen ? "with-sidebar-open" : "with-sidebar-collapsed"}`}>
      <div className="header-left">
        <button className="burger" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>
        <Link to="/welcome/admin" className="brand">
          <span className="brand-badge">S</span>
          <span className="brand-name">SolidarLink</span>
        </Link>
      </div>

      <nav className="header-nav">
        <NavLink to="/welcome/admin/users/association" className="nav-item">Associations</NavLink>
        <NavLink to="/welcome/admin/users/citoyen" className="nav-item">Citoyens</NavLink>
        <NavLink to="/welcome/admin/annonces" className="nav-item">Annonces</NavLink>
        <NavLink to="/welcome/admin/categories" className="nav-item">Catégories</NavLink>
      </nav>

      <div className="header-right">
        <input className="search" type="search" placeholder="Rechercher…" />

        {/* Icône messagerie avec badge dynamique */}
        <Link to="/welcome/admin/chat" className="header-icon messages">
          <MessageCircle size={22} />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </Link>

        <div className="avatar" title="Admin">A</div>
      </div>
    </header>
  );
}
