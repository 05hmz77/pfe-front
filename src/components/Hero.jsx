// components/Hero.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <h1>Connectez-vous à l'engagement solidaire</h1>
        <p className="hero-description">
          SolidarLink met en relation les associations et les citoyens pour créer un impact positif 
          à travers le bénévolat, les événements solidaires et les campagnes de dons.
        </p>
        <div className="hero-actions">
          <Link to="/register?type=citizen" className="btn btn-primary">
            Je suis citoyen →
          </Link>
          <Link to="/register?type=association" className="btn btn-secondary">
            Je suis une association →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;