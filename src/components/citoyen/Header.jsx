import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import axios from "axios";

export default function HeaderAssociation() {
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  // --- Récupération des messages non lus ---
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser?.id) return;
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/my/", {
          headers: { Authorization: `Bearer ${token}` },
        });

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
      try {
        notificationWs.close();
      } catch {}
    };
  }, [currentUser?.id]);

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-blue-400 text-white shadow-md flex items-center justify-between px-6 z-50">
      {/* Logo */}
      <Link to="/welcome/association" className="flex items-center gap-2">
        <span className="bg-white text-blue-400 w-8 h-8 flex items-center justify-center rounded-lg font-bold shadow">
          S
        </span>
        <span className="text-xl font-semibold">SolidarLink</span>
      </Link>

      {/* Messagerie */}
      <div className="relative">
        <Link
          to="/welcome/association/chat"
          className="relative flex items-center justify-center w-10 h-10 bg-white text-blue-400 rounded-full shadow hover:bg-gray-100 transition"
        >
          <MessageCircle size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
