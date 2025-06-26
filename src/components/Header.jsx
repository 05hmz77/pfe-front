// components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>SolidarLink</h1>
          </Link>
          <nav className="main-nav">
            <div className="nav-section">
              <div className="nav-links">
                <Link to="/hero">Home</Link>
                <Link to="/features">Fonctionnalités</Link>
                <Link to="/how-it-works">Comment ça marche</Link>
                <Link to="/testimonials">Témoignages</Link>
              </div>
            </div>
            
            <div className="nav-section">
              <div className="nav-links">
                <Link to="/login" className="btn btn-outline">Connexion</Link>
                <Link to="/register" className="btn btn-primary">Inscription</Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;