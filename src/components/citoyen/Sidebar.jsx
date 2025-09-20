import React from "react";
import {
  Home,
  Users as UsersIcon,
  ClipboardList,
  MessageSquare,
  User,
  Heart,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const Logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const currentUser = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="flex">
      {/* Sidebar fixée sous le header */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300 z-40
        ${isOpen ? "w-1/4" : "w-20"}`}
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          {isOpen ? (
            <NavLink
              to="/welcome/citoyen/dashboard"
              className="flex items-center gap-2 text-lg font-bold text-blue-600"
            >
              <span className="w-6 h-6 bg-blue-600 rounded-lg"></span>
              SolidarLink
            </NavLink>
          ) : (
            <span className="w-6 h-6 bg-blue-600 rounded-lg"></span>
          )}

          <button
            className="p-1 text-gray-400 hover:text-blue-600"
            onClick={toggleSidebar}
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            <NavItem icon={<Home size={20} />} path="/welcome/citoyen/dashboard" label="Dashboard" isOpen={isOpen} />
            <NavItem icon={<UsersIcon size={20} />} path="/welcome/citoyen/listannonce" label="Annonces" isOpen={isOpen} />
            <NavItem icon={<ClipboardList size={20} />} path="/welcome/citoyen/mescandidature" label="Mes candidatures" isOpen={isOpen} />
            <NavItem icon={<MessageSquare size={20} />} path="/welcome/citoyen/chat" label="Messages" isOpen={isOpen} />
            <NavItem icon={<User size={20} />} path="/welcome/citoyen/profile" label="Mon profil" isOpen={isOpen} />
            <NavItem icon={<Heart size={20} />} path="/welcome/citoyen/listAssociation" label="Associations suivies" isOpen={isOpen} />
          </ul>
        </nav>

        {/* Footer user info */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <div>
                <div className="font-semibold text-gray-700">{currentUser?.username}</div>
                <div className="text-xs text-gray-400">{currentUser?.type}</div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                {currentUser?.username?.charAt(0)}
              </div>
            )}
          </div>
          <button
            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"
            onClick={Logout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main
        className={`flex-1 pt-16 p-6 transition-all duration-300 ml-0
        ${isOpen ? "ml-1/4" : "ml-20"}`}
      >
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ icon, path, label, isOpen }) {
  return (
    <li>
      <NavLink
        to={path}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
            isActive
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
          }`
        }
        end
      >
        <span className="flex items-center">{icon}</span>
        {isOpen && <span className="text-sm">{label}</span>}
      </NavLink>
    </li>
  );
}
