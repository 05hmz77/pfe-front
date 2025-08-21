// Header.jsx
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import "./style/Header.css";

export default function Header({ isSidebarOpen, onToggleSidebar }) {
  return (
    <header className={`app-header ${isSidebarOpen ? "with-sidebar-open" : "with-sidebar-collapsed"}`}>
      <div className="header-left">
        <button className="burger" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>
        <Link to="/welcome/admin" className="brand">
          <span className="brand-badge">S</span>
          <span className="brand-name">SolidarLink</span>
        </Link>
      </div>

      <nav className="header-nav">
        <NavLink to="/welcome/admin/users/association" className="nav-item">Associations</NavLink>
        <NavLink to="/welcome/admin/users/citoyen" className="nav-item">Citoyens</NavLink>
        <NavLink to="/welcome/admin/annonces" className="nav-item">Annonces</NavLink>
        <NavLink to="/welcome/admin/categories" className="nav-item">Catégories</NavLink>
      </nav>

      <div className="header-right">
        <input className="search" type="search" placeholder="Rechercher…" />
        <div className="avatar" title="Admin">A</div>
      </div>
    </header>
  );
}
