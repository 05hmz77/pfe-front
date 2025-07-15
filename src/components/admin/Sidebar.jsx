import React from "react";
import { 
  Home, 
  Users,
  Shield,
  BarChart2, 
  Sun, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Megaphone,
  Tag
} from "lucide-react";
import { NavLink, Outlet } from 'react-router-dom';
import "./style/admin.css";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();

const Logout = () => {
  localStorage.clear();
  navigate('/login'); 
};
  return (
    <div className="admin-container">
      <aside className={`admin-sidebar ${isOpen ? "" : "collapsed"}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            {isOpen ? (
              <>
                <span className="logo-icon"></span>
                <NavLink to="/welcome/admin" className="logo-text">SolidarLink</NavLink>
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
                icon={<Home size={20} className="nav-icon-svg" />} 
                path="/welcome/admin/dashboard" 
                label="Dashboard" 
                isOpen={isOpen} 
              />
              <NavItem 
                icon={<Users size={20} className="nav-icon-svg" />} 
                path="/welcome/admin/users/citoyen" 
                label="Gérer citoyens" 
                isOpen={isOpen} 
              />
              <NavItem 
                icon={<Shield size={20} className="nav-icon-svg" />} 
                path="/welcome/admin/users/association" 
                label="Associations" 
                isOpen={isOpen} 
              />
              <NavItem 
                icon={<Tag size={20} className="nav-icon-svg" />} 
                path="/welcome/admin/categories" 
                label="Catégories" 
                isOpen={isOpen} 
              />
              <NavItem 
                icon={<Megaphone size={20} className="nav-icon-svg" />} 
                path="/welcome/admin/annonces" 
                label="Annonces" 
                isOpen={isOpen} 
              />
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="user-info">
              {isOpen ? (
                <>
                  <div className="user-name">Admin</div>
                  <div className="user-role">Administrateur</div>
                </>
              ) : (
                <div className="user-initials">A</div>
              )}
            </div>
            <div className="sidebar-actions">
        
              <button className="action-btn logout" onClick={()=>{Logout()}}>
                <LogOut size={16} className="action-icon" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className={`admin-content ${isOpen ? "" : "expanded"}`}>
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
          `nav-link ${isActive ? "active" : ""}`
        }
        end
      >
        <span className="nav-icon">{icon}</span>
        {isOpen && <span className="nav-label">{label}</span>}
      </NavLink>
    </li>
  );
}