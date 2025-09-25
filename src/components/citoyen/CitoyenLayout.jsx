import React, { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import MyCandidature from "./MyCandidature";
import ListAnnonce from "./ListAnnonces";
import Chat from "./chat";
import CitoyenProfile from "./Profile";
import AssociationSoutenue from "./AssociationSetenu";
import HeaderAssociation from "./Header";
import "./style/CitoyenLayout.css";

export default function CitoyenLayout() {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-1">
      {/* === Header === */}
      <header className="fixed top-0 left-0 w-full h-16 bg-white shadow z-50 flex items-center justify-between px-6">
        <HeaderAssociation toggleSidebar={toggleSidebar} />
      </header>
      <br />
      {/* === Body (Sidebar + Main) === */}
      <div className="flex flex-1 pt-6 pl-6  ">
        {/* === Sidebar === */}
        <aside
          className={` bg-gray-100 transition-all duration-300 overflow-y-auto p-6 
          ${isOpen ? "w-1/4" : "w-20"} `}
        >
          <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </aside>

        {/* === Main content === */}
        <main
          className={`transition-all duration-300 overflow-y-auto p-6 
          ${isOpen ? "w-3/4" : "w-full"}`}
        >
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="listannonce" element={<ListAnnonce />} />
            <Route path="mescandidature" element={<MyCandidature />} />
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<CitoyenProfile />} />
            <Route path="listAssociation" element={<AssociationSoutenue />} />
          </Routes>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
