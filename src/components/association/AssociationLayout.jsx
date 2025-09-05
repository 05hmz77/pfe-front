import React, { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import SidebarAss from "./Sidebar";
import Dashboard from "./Dashboard";
import MyCandidature from "./MyCandidature";
import ListBenevoles from "./ListBenevolas";
import MyAnnonces from "./MyAnnonces";
import ListAnnonce from "./ListAnnonces";
import AssociationProfile from "./Prifile";
import Chat from "./chat";
import HeaderAssociation from "./Header";
import  "./style/AssociationLayout.css"

export default function AssociationLayout() {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);


  return (
    <div className="ass_layout-container">
  <header className="ass_layout-header">
    <HeaderAssociation isSidebarOpen={isOpen} onToggleSidebar={toggleSidebar} />
  </header>

  <div className="ass_layout-content">
    <aside className="ass_layout-sidebar">
      <SidebarAss isOpen={isOpen} toggleSidebar={toggleSidebar} />
    </aside>

    <div className={`ass_layout-main ${isOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <main>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="listannonce" element={<ListAnnonce />} />
          <Route path="mesannonces" element={<MyAnnonces />} />
          <Route path="candidature" element={<MyCandidature />} />
          <Route path="benevoles" element={<ListBenevoles />} />
          <Route path="profile" element={<AssociationProfile />} />
          <Route path="chat" element={<Chat />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
        <Outlet />
      </main>
    </div>
  </div>


</div>

  );
}
