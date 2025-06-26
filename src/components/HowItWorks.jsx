import React from 'react';

const HowItWorks = () => {
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Comment ça marche</h2>
        <div className="steps-container">
          <div className="step-column">
            <h3>Pour les citoyens</h3>
            <div className="step-card animate-fade">
              <span className="step-number">1</span>
              <h4>Créez votre profil</h4>
              <p>Indiquez vos compétences et disponibilités</p>
            </div>
            <div className="step-card animate-fade" style={{ animationDelay: '0.2s' }}>
              <span className="step-number">2</span>
              <h4>Découvrez des opportunités</h4>
              <p>Parcourez les annonces ou recevez des recommandations</p>
            </div>
            <div className="step-card animate-fade" style={{ animationDelay: '0.4s' }}>
              <span className="step-number">3</span>
              <h4>Postulez et participez</h4>
              <p>Engagez-vous et suivez votre impact</p>
            </div>
          </div>
          <div className="step-column">
            <h3>Pour les associations</h3>
            <div className="step-card animate-fade">
              <span className="step-number">1</span>
              <h4>Créez votre page</h4>
              <p>Présentez votre association et vos missions</p>
            </div>
            <div className="step-card animate-fade" style={{ animationDelay: '0.2s' }}>
              <span className="step-number">2</span>
              <h4>Publiez des annonces</h4>
              <p>Décrivez vos besoins en bénévolat ou événements</p>
            </div>
            <div className="step-card animate-fade" style={{ animationDelay: '0.4s' }}>
              <span className="step-number">3</span>
              <h4>Gérez les candidatures</h4>
              <p>Sélectionnez les bénévoles et évaluez leur participation</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;