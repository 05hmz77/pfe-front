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
import { NavLink, Outlet } from "react-router-dom";
import "./style/admin.css";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate=useNavigate()
  const Logout = () => {
  localStorage.clear();
  navigate('/login'); 
};
  const currentUser = JSON.parse(localStorage.getItem("user"));
  return (
    <div className="admin-container">
      <aside className={`admin-sidebar ${isOpen ? "" : "collapsed"}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            {isOpen ? (
              <>
                <span className="logo-icon"></span>
                <NavLink to="/welcome/admin" className="logo-text">
                  SolidarLink
                </NavLink>
              </>
            ) : (
              <span className="logo-icon"></span>
            )}
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            <ul>
              <NavItem
                icon={<Home size={20} />}
                path="/welcome/citoyen/dashboard"
                label="Dashboard"
                isOpen={isOpen}
              />
              <NavItem
                icon={<UsersIcon size={20} />}
                path="/welcome/citoyen/listannonce"
                label="Annonces"
                isOpen={isOpen}
              />
              <NavItem
                icon={<ClipboardList size={20} />}
                path="/welcome/citoyen/mescandidature"
                label="Mes candidatures"
                isOpen={isOpen}
              />
              <NavItem
                icon={<MessageSquare size={20} />}
                path="/welcome/citoyen/chat"
                label="Messages"
                isOpen={isOpen}
              />
              <NavItem
                icon={<User size={20} />}
                path="/welcome/citoyen/profile"
                label="Mon profil"
                isOpen={isOpen}
              />
              <NavItem
                icon={<Heart size={20} />}
                path="/welcome/citoyen/listAssociation"
                label="Associations suivies"
                isOpen={isOpen}
              />
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="user-info">
              {isOpen ? (
                <>
                  
                  <div className="user-name">{currentUser.username}</div>
                  <div className="user-role">{currentUser.type}</div>
                </>
              ) : (
                <div className="user-initials">
                  {currentUser.username.charAt(0)}
                </div>
              )}
            </div>
            <div className="sidebar-actions">
              <button className="action-btn logout" onClick={()=>{Logout()}}>
              
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="cnt-nav">
      <main className={`admin-content ${isOpen ? "" : "expanded"}`}>
        <Outlet />
      </main>
      </div>

      
    </div>
  );
}

function NavItem({ icon, path, label, isOpen }) {
  return (
    <li>
      <NavLink
        to={path}
        className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        end
      >
        <span className="nav-icon">{icon}</span>
        {isOpen && <span className="nav-label1">{label}</span>}
      </NavLink>
    </li>
  );
}