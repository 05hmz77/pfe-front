// Sidebar.jsx
import React from "react";
import { 
  Home, Users, Shield, Megaphone, Tag, LogOut, ChevronLeft, ChevronRight 
} from "lucide-react";
import { NavLink } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import "./style/Sidebar.css"
export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();

  const Logout = () => {
    localStorage.clear();
    navigate('/login'); 
  };

  return (
    <aside className={`sidebar-container ${isOpen ? "open" : "collapsed"}`}>
      <div className="sidebar-wrapper">
        
        {/* Header */}
        <div className="sidebar-top">
          {isOpen ? (
            <>
              
              <NavLink to="/welcome/admin" className="sidebar-logo-text">SolidarLink</NavLink>
            </>
          ) : (
            <p>SLK</p>
            
          )}
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-menu">
          <ul className="sidebar-menu-list">
            <NavItem icon={<Home size={20} />} path="/welcome/admin/dashboard" label="Dashboard" isOpen={isOpen} />
            <NavItem icon={<Users size={20} />} path="/welcome/admin/users/citoyen" label="Gérer citoyens" isOpen={isOpen} />
            <NavItem icon={<Shield size={20} />} path="/welcome/admin/users/association" label="Associations" isOpen={isOpen} />
            <NavItem icon={<Tag size={20} />} path="/welcome/admin/categories" label="Catégories" isOpen={isOpen} />
            <NavItem icon={<Megaphone size={20} />} path="/welcome/admin/annonces" label="Annonces" isOpen={isOpen} />
          </ul>
        </nav>

        {/* Footer / User info */}
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            {isOpen ? (
              <>
                <div className="sidebar-user-name">Admin</div>
                <div className="sidebar-user-role">Administrateur</div>
              </>
            ) : (
              <div className="sidebar-user-initials">A</div>
            )}
          </div>
          <div className="sidebar-actions">
            <button className="sidebar-btn-logout" onClick={Logout}>
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
    <li className="sidebar-menu-item">
      <NavLink
        to={path}
        className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
      >
        <span className="sidebar-link-icon">{icon}</span>
        {isOpen && <span className="sidebar-link-label">{label}</span>}
      </NavLink>
    </li>
  );
}
