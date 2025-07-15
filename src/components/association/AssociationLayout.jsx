import React, { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import MyCandidature from "./MyCandidature";
import ListBenevoles from "./ListBenevolas";
import MyAnnonces from "./MyAnnonces";
import ListAnnonce from "./ListAnnonces";
import AssociationProfile from "./Prifile";
import Chat from "./chat";

export default function AssociationLayout() {
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
          <Route
            path="/listannonce"
            element={<ListAnnonce />}
          />
          <Route path="/mesannonces"element={<MyAnnonces />}/>
          <Route path="/candidature" element={<MyCandidature />} />
          <Route path="/benevoles" element={<ListBenevoles />} />
          <Route path="/profile" element={<AssociationProfile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
        <Outlet />
      </main>
    </div>
  );
}
