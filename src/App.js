import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;