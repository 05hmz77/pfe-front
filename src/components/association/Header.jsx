import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Menu } from "lucide-react";
import axios from "axios";

export default function HeaderAssociation({ isSidebarOpen, onToggleSidebar }) {
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

        const counts = await Promise.all(
          (res.data || []).map(async (conv) => {
            try {
              const r = await axios.get(
                `http://127.0.0.1:8000/api/last-message-not-lu/${conv.id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return parseInt(r.data.nb_msg || "0", 10);
            } catch {
              return 0;
            }
          })
        );

        setUnreadCount(counts.reduce((a, b) => a + b, 0));
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

    const ws = new WebSocket(notificationUrl);
    const onMsg = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "notification") setUnreadCount((p) => p + 1);
      } catch (err) {
        console.error("Erreur WebSocket notifications:", err);
      }
    };

    ws.addEventListener("message", onMsg);
    return () => {
      ws.removeEventListener("message", onMsg);
      try { ws.close(); } catch {}
    };
  }, [currentUser?.id]);

  return (
    <div className="h-14 sm:h-16 flex items-center justify-between">
      {/* Left: Burger + Brand */}
      <div className="flex items-center gap-3">
        {/* Bouton sidebar (affiché surtout en mobile) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-gray-50"
            aria-label="Ouvrir la navigation"
          >
            <Menu size={18} />
          </button>
        )}

        <Link to="/welcome/association" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-xl grid place-items-center bg-blue-600 text-white font-semibold">
            S
          </span>
          <span className="hidden sm:inline text-lg font-semibold tracking-tight">
            Solidar<span className="text-blue-600">Link</span>
          </span>
        </Link>
      </div>

      {/* Right: Messagerie */}
      <div className="flex items-center gap-2">
        <Link
          to="/welcome/association/chat"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
          aria-label="Messagerie"
        >
          <MessageCircle size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] grid place-items-center">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
