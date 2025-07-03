import React from "react";
import { 
  Home, 
  Users as UsersIcon, 
  BarChart2, 
  Sun, 
  LogOut, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { NavLink, Outlet } from 'react-router-dom';
import "./admin.css";

export default function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <div className="admin-container">
      <aside className={`admin-sidebar ${isOpen ? "" : "collapsed"}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            {isOpen ? (
              <>
                <span className="logo-icon">❤️</span>
                <NavLink to="/welcome/admin" className="logo-text">SolidarLink</NavLink>
              </>
            ) : (
              <span className="logo-icon">❤️</span>
            )}
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            <ul>
              <NavItem 
                icon={<Home size={20} />} 
                path="/welcome/admin/dashboard" 
                label="Dashboard" 
                isOpen={isOpen} 
              />
              <NavItem 
                icon={<UsersIcon size={20} />} 
                path="/welcome/admin/users" 
                label="Users" 
                isOpen={isOpen} 
              />
              <NavItem 
                icon={<BarChart2 size={20} />} 
                path="/welcome/admin/stats" 
                label="Statistics" 
                isOpen={isOpen} 
              />
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="user-info">
              {isOpen ? (
                <>
                  <div className="user-name">Admin</div>
                  <div className="user-role">Administrator</div>
                </>
              ) : (
                <div className="user-initials">A</div>
              )}
            </div>
            <div className="sidebar-actions">
              <button className="action-btn">
                <Sun size={16} />
              </button>
              <button className="action-btn logout">
                <LogOut size={16} />
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