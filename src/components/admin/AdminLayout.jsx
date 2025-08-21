// AdminLayout.jsx
import React, { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Statistics from "./Statistics";
import Citoyen from "./Citoyen";
import Association from "./Association";
import CategorieManager from "./CategorieManager";
import AnnonceManager from "./AnnonceManager";
import "./style/AdminLayout.css"; // <-- style global du layout
import Header from "./Header";
export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="layout-container">
      
      {/* Sidebar */}
      <div className="layout-sidebar">
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      </div>
      
      {/* Contenu principal */}
      <div className={`layout-main ${isOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
        <header className="layout-header">
          <Header isSidebarOpen={isOpen} onToggleSidebar={toggleSidebar} />
        </header>

        <main className="layout-content">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users/citoyen" element={<Citoyen />} />
            <Route path="users/association" element={<Association />} />
            <Route path="stats" element={<Statistics />} />
            <Route path="categories" element={<CategorieManager />} />
            <Route path="annonces" element={<AnnonceManager />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
          <Outlet />
        </main>

        <footer className="layout-footer">
          {/* Footer si nécessaire */}
        </footer>
      </div>
    </div>
  );
}
