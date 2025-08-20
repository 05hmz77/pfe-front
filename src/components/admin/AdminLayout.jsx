import React, { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Statistics from "./Statistics";
import Citoyen from "./Citoyen";
import Association from "./Association";
import CategorieManager from "./CategorieManager";
import AnnonceManager from "./AnnonceManager";

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="admin-layout">
      {/* Overlay quand sidebar ouverte en mode mobile */}
      {isOpen && <div className="overlay" onClick={toggleSidebar}></div>}

      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <main className={`admin-main-content ${isOpen ? "open" : "collapsed"}`}>
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
    </div>
  );
}
