import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import TestimonialsPage from './pages/TestimonialsPage';
import './App.css';
import Hero from './components/Hero';
import Homepage from './pages/Homepage';
import Inscription from './authentification/inscription';
import Login from './authentification/login';
import Dashboard from './pages/Dashboard';

import Sidebar from './components/admin/Sidebar.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import AssociationLayout from './components/association/AssociationLayout.jsx';
import CitoyenLayout from './components/citoyen/CitoyenLayout.jsx';


function App() {
  return (
    <Router>
      <div className="app">
        <main>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Inscription />} />
            <Route path="/dashboard" element={<Dashboard />} />

            

            <Route path="/welcome/admin/*" element={<AdminLayout />} />
            <Route
              path="/welcome/association/*"
              element={<AssociationLayout />}
            />
            <Route
              path="/welcome/citoyen/*"
              element={<CitoyenLayout />}
            />
          </Routes>
        </main>
        <main className="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;