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
    <div className="flex inset-0 h-[70%] items-center justify-center">
      {/* Sidebar fixée sous le header */}
      <aside
        className={`fixed top-25 t-84 h-[calc(90vh-4rem)] bg-white rounded-[22px] flex flex-col justify-between transition-all duration-300 z-40 shadow-lg
        ${isOpen ? "w-1/4" : "w-20"}`}
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-blue-100">
          {isOpen ? (
            <NavLink
              to="/welcome/citoyen/dashboard"
              className="flex items-center gap-3 text-xl font-bold text-blue-400"
            >
              <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SL</span>
              </div>
              SolidarLink
            </NavLink>
          ) : (
            <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">SL</span>
            </div>
          )}

          <button
            className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
            onClick={toggleSidebar}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-2 px-3">
            <NavItem icon={<Home size={22} />} path="/welcome/citoyen/dashboard" label="Dashboard" isOpen={isOpen} />
            <NavItem icon={<UsersIcon size={22} />} path="/welcome/citoyen/listannonce" label="Annonces" isOpen={isOpen} />
            <NavItem icon={<ClipboardList size={22} />} path="/welcome/citoyen/mescandidature" label="Mes candidatures" isOpen={isOpen} />
            <NavItem icon={<MessageSquare size={22} />} path="/welcome/citoyen/chat" label="Messages" isOpen={isOpen} />
            <NavItem icon={<User size={22} />} path="/welcome/citoyen/profile" label="Mon profil" isOpen={isOpen} />
            <NavItem icon={<Heart size={22} />} path="/welcome/citoyen/listAssociation" label="Associations suivies" isOpen={isOpen} />
          </ul>
        </nav>

        {/* Footer user info */}
        <div className="px-4 py-4 border-t border-blue-100 flex items-center justify-between bg-blue-50 rounded-b-[22px]">
          <div className="flex items-center gap-3">
            {isOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center font-bold text-white text-lg">
                  {currentUser?.username?.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-base">{currentUser?.username}</div>
                  <div className="text-sm text-blue-400 capitalize">{currentUser?.type}</div>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center font-bold text-white text-lg">
                {currentUser?.username?.charAt(0)}
              </div>
            )}
          </div>
          <button
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
            onClick={Logout}
          >
            <LogOut size={20} />
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
          `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
          ${isActive
            ? "bg-blue-400 text-white shadow-md"
            : "text-gray-700 hover:bg-blue-50 hover:text-blue-400"
          }`
        }
        end
      >
        <span className="flex items-center">{icon}</span>
        {isOpen && <span className="text-base">{label}</span>}
      </NavLink>
    </li>
  );
}