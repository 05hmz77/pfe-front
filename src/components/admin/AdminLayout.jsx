import React, { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";

import Statistics from "./Statistics";
import Citoyen from "./Citoyen";
import Association from "./Association";

export default function AdminLayout() {
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
          <Route path="users/citoyen" element={<Citoyen />} />
          <Route path="users/association" element={<Association />} />
          <Route path="stats" element={<Statistics />} />
          {/* Optionnel: route fallback */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
        <Outlet />
      </main>
    </div>
     
  );
}
