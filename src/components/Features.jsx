// components/Features.jsx
import React from 'react';

const Features = () => {
  return (
    <section className="features-section">
      <div className="container">
        <h2 className="section-title">Nos fonctionnalités</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <h3>Mise en relation</h3>
            <p>Trouvez des opportunités de bénévolat qui correspondent à vos compétences et disponibilités.</p>
          </div>
          
          <div className="feature-card">
            <h3>Événements solidaires</h3>
            <p>Participez à des événements locaux et créez un impact positif dans votre communauté.</p>
          </div>
          
          <div className="feature-card">
            <h3>Recommandations IA</h3>
            <p>Recevez des suggestions personnalisées basées sur vos intérêts et votre historique d'engagement.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;