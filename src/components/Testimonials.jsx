import React from 'react';

const Testimonials = () => {
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Ils nous font confiance</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card animate-fade">
            <div className="testimonial-content">
              <p>
                "Grâce à SolidarLink, nous avons trouvé des bénévoles passionnés qui partagent nos valeurs. 
                La plateforme a révolutionné notre façon de recruter."
              </p>
              <div className="testimonial-author">Marie Dupont</div>
              <div className="testimonial-role">Présidente, Les Restos du Cœur</div>
            </div>
          </div>
          <div className="testimonial-card animate-fade" style={{ animationDelay: '0.2s' }}>
            <div className="testimonial-content">
              <p>
                "J'ai découvert des opportunités de bénévolat qui correspondent parfaitement à mes compétences 
                et à mes disponibilités. Une expérience enrichissante !"
              </p>
              <div className="testimonial-author">Thomas Martin</div>
              <div className="testimonial-role">Bénévole régulier</div>
            </div>
          </div>
          <div className="testimonial-card animate-fade" style={{ animationDelay: '0.4s' }}>
            <div className="testimonial-content">
              <p>
                "La fonction de recommandation IA m'a permis de découvrir des causes auxquelles je n'aurais 
                jamais pensé. Je suis maintenant engagé dans plusieurs projets passionnants."
              </p>
              <div className="testimonial-author">Sophie Legrand</div>
              <div className="testimonial-role">Citoyenne engagée</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;