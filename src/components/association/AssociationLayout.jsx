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

export default function AssociationLayout() {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen((v) => !v);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex flex-col">
      {/* HEADER STICKY */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <HeaderAssociation
            isSidebarOpen={isOpen}
            onToggleSidebar={toggleSidebar}
          />
        </div>
      </header>

      {/* LAYOUT */}
      <div className="flex-1 flex">
        {/* SIDEBAR DESKTOP (toujours là en >= lg) */}
        <div className="hidden lg:block">
          <SidebarAss isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>

        {/* SIDEBAR MOBILE (tiroir + overlay) */}
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={toggleSidebar}
            />
            <div className="absolute left-0 top-0 h-full">
              {/* En mobile, on force ouvert pour afficher le menu complet */}
              <SidebarAss isOpen={true} toggleSidebar={toggleSidebar} />
            </div>
          </div>
        )}

        {/* MAIN */}
        <div className="flex-1 min-w-0">
          <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
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
