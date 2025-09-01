import React from "react";
import {
  Home,
  Users as UsersIcon,
  FileText,
  ClipboardList,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink,  useNavigate } from "react-router-dom";
import "./style/Sidebar.css";

export default function SidebarAss({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const curent_user=localStorage.getItem("user")

  const Logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside className={`ass_sidebar-container ${isOpen ? "open" : "collapsed"}`}>
      <div className="ass_sidebar-wrapper">
        {/* --- Header --- */}
        <div className="ass_sidebar-top">
          {isOpen ? (
            <>
              <NavLink to="/welcome/association" className="ass_sidebar-logo-text">
                SolidarLink
              </NavLink>
            </>
          ) : (
            <p></p>
          )}
          <button className="ass_sidebar-toggle-btn" onClick={toggleSidebar}>
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* --- Menu --- */}
        <nav className="ass_sidebar-menu">
          <ul className="ass_sidebar-menu-list">
            <NavItem
              icon={<Home size={20} />}
              path="/welcome/association/dashboard"
              label="Dashboard"
              isOpen={isOpen}
            />
            <NavItem
              icon={<FileText size={20} />}
              path="/welcome/association/listannonce"
              label="Annonces"
              isOpen={isOpen}
            />
            <NavItem
              icon={<ClipboardList size={20} />}
              path="/welcome/association/mesannonces"
              label="Mes annonces"
              isOpen={isOpen}
            />
            <NavItem
              icon={<UserCheck size={20} />}
              path="/welcome/association/candidature"
              label="Mes candidatures"
              isOpen={isOpen}
            />
            <NavItem
              icon={<UsersIcon size={20} />}
              path="/welcome/association/benevoles"
              label="Bénévoles"
              isOpen={isOpen}
            />
            <NavItem
              icon={<UsersIcon size={20} />}
              path="/welcome/association/profile"
              label="Profil"
              isOpen={isOpen}
            />
            <NavItem
              icon={<UsersIcon size={20} />}
              path="/welcome/association/chat"
              label="Messagerie"
              isOpen={isOpen}
            />
          </ul>
        </nav>

        {/* --- Footer --- */}
        <div className="ass_sidebar-bottom">
          {isOpen ? (
              <>
                <div className="sidebar-user-name">{curent_user.usename}</div>
                <div className="sidebar-user-role">Association</div>
              </>
            ) : (
              <div className="sidebar-user-initials">A</div>
            )}

          <div className="ass_sidebar-actions">
            <button className="ass_sidebar-btn-logout" onClick={Logout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, path, label, isOpen }) {
  return (
    <li className="ass_sidebar-menu-item">
      <NavLink
        to={path}
        className={({ isActive }) => `ass_sidebar-link ${isActive ? "active" : ""}`}
      >
        <span className="ass_sidebar-link-icon">{icon}</span>
        {isOpen && <span className="ass_sidebar-link-label">{label}</span>}
      </NavLink>
    </li>
  );
}
