import React, { useState } from "react";
import Sidebar from "../components/admin/Sidebar";
import "./home.css";
import { Outlet } from 'react-router-dom';

export default function HomePageAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <main className={`admin-content ${sidebarOpen ? "" : "collapsed"}`}>
        <Outlet />
      </main>
      <h1>hello</h1>
    </div>
  );
}