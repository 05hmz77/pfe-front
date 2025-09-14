import React from "react";
import {
  LayoutDashboard,
  Megaphone,
  ClipboardList,
  Users,
  UserCircle,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

export default function SidebarAss({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const current_user = JSON.parse(localStorage.getItem("user"));

  const Logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside
      className={`sticky top-0 h-screen bg-white border-r shadow-sm transition-[width] duration-300 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="flex h-full flex-col px-2 py-3">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-2">
          {isOpen ? (
            <div className="ml-1 text-lg font-semibold tracking-tight">
              Solidar<span className="text-blue-600">Link</span>
            </div>
          ) : (
            <div className="mx-auto h-8 w-8 rounded-lg bg-blue-600 text-white grid place-items-center text-sm font-semibold">
              S
            </div>
          )}
          <button
            onClick={toggleSidebar}
            aria-label="Basculer la barre latérale"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-gray-50"
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            to="/welcome/association/dashboard"
            label="Dashboard"
            isOpen={isOpen}
          />
          <NavItem
            icon={<Megaphone size={20} />}
            to="/welcome/association/listannonce"
            label="Annonces"
            isOpen={isOpen}
          />
          <NavItem
            icon={<ClipboardList size={20} />}
            to="/welcome/association/mesannonces"
            label="Mes annonces"
            isOpen={isOpen}
          />
          <NavItem
            icon={<ClipboardList size={20} />}
            to="/welcome/association/candidature"
            label="Mes candidatures"
            isOpen={isOpen}
          />
          <NavItem
            icon={<Users size={20} />}
            to="/welcome/association/benevoles"
            label="Bénévoles"
            isOpen={isOpen}
          />
          <NavItem
            icon={<UserCircle size={20} />}
            to="/welcome/association/profile"
            label="Profil"
            isOpen={isOpen}
          />
          <NavItem
            icon={<MessageSquare size={20} />}
            to="/welcome/association/chat"
            label="Messagerie"
            isOpen={isOpen}
          />
        </nav>

        {/* Footer */}
        <div className="mt-3 border-t pt-3">
          <div className={`flex items-center ${isOpen ? "justify-between" : "justify-center"}`}>
            {isOpen ? (
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gray-100 grid place-items-center border text-sm font-semibold">
                  {current_user?.username?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {current_user?.username || "Association"}
                  </div>
                  <div className="text-xs text-gray-500">Association</div>
                </div>
              </div>
            ) : (
              <div className="h-9 w-9 rounded-lg bg-gray-100 grid place-items-center border text-sm font-semibold">
                {current_user?.username?.[0]?.toUpperCase() || "A"}
              </div>
            )}

            <button
              onClick={Logout}
              title="Se déconnecter"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-gray-50 ${
                isOpen ? "" : "mt-2"
              }`}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, to, label, isOpen }) {
  return (
    <NavLink
      to={to}
      title={!isOpen ? label : undefined}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-xl px-2 py-2 transition",
          "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
          isActive ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200" : "",
          isOpen ? "justify-start" : "justify-center",
        ].join(" ")
      }
    >
      <span
        className={[
          "grid place-items-center rounded-lg",
          isOpen ? "h-9 w-9 bg-white border" : "h-10 w-10 bg-white border",
        ].join(" ")}
      >
        {icon}
      </span>
      {isOpen && (
        <span className="truncate text-sm font-medium">{label}</span>
      )}
    </NavLink>
  );
}
