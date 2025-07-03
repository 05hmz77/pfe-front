import React, { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import MyCandidature from "./MyCandidature";
import ListAnnonce from "./ListAnnonces";

export default function CitoyenLayout() {
  // Gérer l'état du sidebar ici
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="admin-layout">
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <main className={`admin-main-content ${isOpen ? "" : "expanded"}`}>
        <Routes>
          {/* Les chemins sont relatifs à /welcome/admin */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="/listannonce" element={<ListAnnonce />} />
          <Route path="/mescandidature" element={<MyCandidature />} />
        </Routes>
        <Outlet />
      </main>
    </div>
  );
}
