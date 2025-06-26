import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-links">
            <h3>SolidarLink</h3>
            <ul>
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/features">Fonctionnalités</Link></li>
              <li><Link to="/how-it-works">Comment ça marche</Link></li>
              <li><Link to="/testimonials">Témoignages</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h3>Compte</h3>
            <ul>
              <li><Link to="/login">Connexion</Link></li>
              <li><Link to="/register">Inscription</Link></li>
              <li><Link to="/forgot-password">Mot de passe oublié</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h3>Légal</h3>
            <ul>
              <li><Link to="/terms">Conditions d'utilisation</Link></li>
              <li><Link to="/privacy">Politique de confidentialité</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 SolidarLink. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;