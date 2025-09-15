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
import "./style/Sidebar.css";

export default function SidebarAss({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const current_user = JSON.parse(localStorage.getItem("user"));

  const Logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside className={`ass_sidebar-container ${isOpen ? "open" : "collapsed"}`}>
      <div className="ass_sidebar-wrapper">
        {/* --- Header --- */}
        <div className="ass_sidebar-top">
          {isOpen && <h2 className="ass_sidebar-logo-text">SolidarLink</h2>}
          <button className="ass_sidebar-toggle-btn" onClick={toggleSidebar}>
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* --- Menu --- */}
        <nav className="ass_sidebar-menu">
          <NavItem
            icon={<LayoutDashboard size={22} />}
            path="/welcome/association/dashboard"
            label="Dashboard"
            isOpen={isOpen}
          />
          <NavItem
            icon={<Megaphone size={22} />}
            path="/welcome/association/listannonce"
            label="Annonces"
            isOpen={isOpen}
          />
          <NavItem
            icon={<ClipboardList size={22} />}
            path="/welcome/association/mesannonces"
            label="Mes annonces"
            isOpen={isOpen}
          />
          <NavItem
            icon={<ClipboardList size={22} />}
            path="/welcome/association/candidature"
            label="Mes candidatures"
            isOpen={isOpen}
          />
          <NavItem
            icon={<Users size={22} />}
            path="/welcome/association/benevoles"
            label="Bénévoles"
            isOpen={isOpen}
          />
          <NavItem
            icon={<UserCircle size={22} />}
            path="/welcome/association/profile"
            label="Profil"
            isOpen={isOpen}
          />
          <NavItem
            icon={<MessageSquare size={22} />}
            path="/welcome/association/chat"
            label="Messagerie"
            isOpen={isOpen}
          />
        </nav>

        <hr className="ass_sidebar-divider" />

        {/* --- Footer --- */}
        <div className="ass_sidebar-bottom">
          {isOpen ? (
            <div className="ass_sidebar-user">
              <div className="sidebar-user-avatar">
                {current_user?.username?.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <div className="sidebar-user-name">
                  {current_user?.username || "Association"}
                </div>
                <div className="sidebar-user-role">Association</div>
              </div>
            </div>
          ) : (
            <div className="sidebar-user-avatar">
              {current_user?.username?.charAt(0).toUpperCase() || "A"}
            </div>
          )}

          <button className="ass_sidebar-btn-logout" onClick={Logout}>
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, path, label, isOpen }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `ass_sidebar-link ${isActive ? "active" : ""}`
      }
    >
      <span className="ass_sidebar-link-icon">{icon}</span>
      {isOpen && <span className="ass_sidebar-link-label">{label}</span>}
    </NavLink>
  );
}
