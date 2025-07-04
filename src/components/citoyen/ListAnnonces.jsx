import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style/ListAnnonces.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ListAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnonces();
  }, []);

  const fetchAnnonces = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get("http://127.0.0.1:8000/api/annonces/", { headers });
      setAnnonces(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast.error("Erreur lors du chargement des annonces");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  if (loading) return <div className="dashboard loading">Chargement en cours...</div>;
  if (error) return <div className="dashboard error">Erreur: {error}</div>;

  return (
    <div className="social-feed">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="feed-header">
        <h1>Annonces</h1>
      </div>

      <div className="posts-container">
        {annonces.length > 0 ? (
          annonces.map((annonce) => (
            <div className="post-card" key={annonce.id}>
              <div className="post-header">
                <div className="user-info">
                  <img 
                    src={annonce.association?.logo || '/default-avatar.png'} 
                    alt={annonce.association?.nom || 'Association'} 
                    className="user-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <div>
                    <h3>{annonce.association?.nom || 'Association inconnue'}</h3>
                    <span className="post-time">
                      {formatDate(annonce.date_creation)}
                    </span>
                  </div>
                </div>
                <div className="post-type-badge">
                  {annonce.type === 'EVENEMENT' && <span className="event-badge">Événement</span>}
                  {annonce.type === 'BESOIN' && <span className="need-badge">Besoin</span>}
                  {annonce.type === 'OFFRE' && <span className="offer-badge">Offre</span>}
                </div>
              </div>
              
              <div className="post-content">
                <h2 className="post-title">{annonce.titre}</h2>
                <p className="post-text">{annonce.description}</p>
                
                <div className="post-details">
                  <div className="detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{annonce.lieu}</span>
                  </div>
                  <div className="detail-item">
                    <i className="far fa-calendar-alt"></i>
                    <span>Début: {formatDate(annonce.date_debut)}</span>
                  </div>
                  <div className="detail-item">
                    <i className="far fa-calendar-check"></i>
                    <span>Fin: {formatDate(annonce.date_fin)}</span>
                  </div>
                </div>
              </div>
              
              <div className="post-actions">
                <button className="action-btn like-btn">
                  <i className="far fa-thumbs-up"></i> J'aime
                </button>
                <button className="action-btn comment-btn">
                  <i className="far fa-comment"></i> Commenter
                </button>
                <button className="action-btn share-btn">
                  <i className="fas fa-share"></i> Partager
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-feed">
            <p>Aucune annonce disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}