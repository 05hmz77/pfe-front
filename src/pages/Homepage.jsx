// Homepage.jsx
import React from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import Footer from "../components/Footer";
import "./index.css";

const Homepage = () => {
  return (
    <div className="home-container">
      <header className="app-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <h1>SolidarLink</h1>
          </Link>
          <nav className="main-nav">
            <a href="#hero" className="nav-item">
              Home
            </a>
            <a href="#features" className="nav-item">
              Fonctionnalités
            </a>
            <a href="#howitworks" className="nav-item">
              Comment ça marche
            </a>
            <a href="#testimonials" className="nav-item">
              Témoignages
            </a>
            <div className="auth-buttons">
              <Link to="/login" className="btn login-btn">
                Connexion
              </Link>
              <Link to="/register" className="btn register-btn">
                Inscription
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section id="hero" className="hero-container">
          <Hero />
        </section>

        <section class="divider-section"></section>

        <section id="features" className="features-container">
          <Features />
        </section>
        <section class="divider-section"></section>
        <section id="howitworks" className="howitworks-container">
          <HowItWorks />
        </section>
        <section class="divider-section"></section>
        <section id="testimonials" className="testimonials-container">
          <Testimonials />
        </section>
        <section class="divider-section"></section>
        <section id="foter" className="foter-container">
          <Footer />
        </section>
      </main>
    </div>
  );
};

export default Homepage;
