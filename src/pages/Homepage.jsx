// Homepage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';

const Homepage = () => {
  return (
    <div className="home-container">
      <header className="app-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <h1>SolidarLink</h1>
          </Link>
          <nav className="main-nav">
            <a href="#hero" className="nav-item">Home</a>
            <a href="#features" className="nav-item">Fonctionnalités</a>
            <a href="#howitworks" className="nav-item">Comment ça marche</a>
            <a href="#testimonials" className="nav-item">Témoignages</a>
            <div className="auth-buttons">
              <Link to="/login" className="btn login-btn">Connexion</Link>
              <Link to="/register" className="btn register-btn">Inscription</Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section id="hero" className="hero-container">
          <Hero />
        </section>

        <section id="features" className="section-container">
          <div className="content-wrapper">
            <Features />
          </div>
        </section>

        <section id="howitworks" className="section-container">
          <div className="content-wrapper">
            <HowItWorks />
          </div>
        </section>

        <section id="testimonials" className="section-container">
          <div className="content-wrapper">
            <Testimonials />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Homepage;