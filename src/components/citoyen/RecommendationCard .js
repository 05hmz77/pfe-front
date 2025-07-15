// RecommendationCard.js
import React from "react";
import "./style/annonce.css";

const RecommendationCard = ({ annonce, onPostulerClick }) => {
  return (
    <div className="suggestion-card">
      <div className="suggestion-card-header">
        <img
          src={`http://localhost:8000/media/${annonce.association?.logo}`}
          alt={annonce.association?.nom}
          className="suggestion-association-logo"
          onError={(e) => (e.target.src = "/profile.jpg")}
        />
        <div className="suggestion-card-header-text">
          <h3 className="suggestion-title">{annonce.titre}</h3>
          <p className="suggestion-association">{annonce.association?.nom}</p>
        </div>
      </div>

      <div className="suggestion-card-body">
        <span className="suggestion-category-badge">{annonce.categorie}</span>
        <p className="suggestion-description">
          {annonce.description?.substring(0, 120)}...
        </p>
      </div>

      <div className="suggestion-card-footer">
        <div className="suggestion-meta">
          <span className="suggestion-date">
            <i className="far fa-calendar-alt"></i>{" "}
            {new Date(annonce.date_publication).toLocaleDateString()}
          </span>
          <span className="suggestion-location">
            <i className="fas fa-map-marker-alt"></i>{" "}
            {annonce.localisation || "Non spécifié"}
          </span>
        </div>
        <button
          className="suggestion-apply-btn"
          onClick={() => onPostulerClick(annonce)}
        >
          <i className="fas fa-paper-plane"></i> Postuler
        </button>
      </div>
    </div>
  );
};

export default RecommendationCard;
