import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style/ListAnnonces.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ListAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [message, setMessage] = useState("");

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
      day: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const handlePostulerClick = (annonce) => {
    setSelectedAnnonce(annonce);
    setShowModal(true);
  };

  const handleSubmitCandidature = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const formData = {
        annonce: selectedAnnonce.id,
        statut: "EN_ATTENTE",
        message: message || "Je souhaite participer à cette annonce",
        date_candidature: new Date().toISOString()
      };

      const response = await axios.post(
        "http://127.0.0.1:8000/api/candidatures/", 
        formData, 
        { headers }
      );

      if (response.status === 201) {
        toast.success("Votre candidature a bien été envoyée !");
        setShowModal(false);
        setMessage("");
      }
    } catch (err) {
      toast.error("Erreur lors de l'envoi de la candidature");
      console.error(err);
    }
  };

  if (loading) return <div className="loading-screen">Chargement en cours...</div>;
  if (error) return <div className="error-screen">Erreur: {error}</div>;

  return (
    <div className="annonces-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Modal de candidature */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Postuler</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setMessage("");
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <p className="annonce-title">{selectedAnnonce?.titre}</p>
              
              <div className="form-group">
                <label>Votre message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Expliquez pourquoi vous souhaitez participer..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn secondary"
                onClick={() => {
                  setShowModal(false);
                  setMessage("");
                }}
              >
                Annuler
              </button>
              <button 
                className="btn primary"
                onClick={handleSubmitCandidature}
              >
                Envoyer la candidature
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="page-header">
        <h1>Annonces disponibles</h1>
        <p>Découvrez les opportunités de bénévolat près de chez vous</p>
      </header>

      <div className="annonces-grid">
        {annonces.length > 0 ? (
          annonces.map((annonce) => (
            <div className="annonce-card" key={annonce.id}>
              <div className="annonce-header">
                <div className="association-info">
                  <img 
                    src="http://127.0.0.1:8000/media/logos/media/logos/20250704_011822_fc88bdcb.jpeg"
                    alt={annonce.association?.nom} 
                    className="association-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <div>
                    <h3>{annonce.association?.nom || 'Association'}</h3>
                    <span className="annonce-date">
                      Publié le {formatDate(annonce.date_creation)}
                    </span>
                  </div>
                </div>
                <span className={`annonce-type ${annonce.type.toLowerCase()}`}>
                  {annonce.type === 'EVENEMENT' ? 'Événement' : 
                   annonce.type === 'BESOIN' ? 'Besoin' : 'Offre'}
                </span>
              </div>
              
              <div className="annonce-content">
                <h2>{annonce.titre}</h2>
                <p className="annonce-description">{annonce.description}</p>
                
                <div className="annonce-details">
                  <div className="detail">
                    <span className="icon">📍</span>
                    <span>{annonce.lieu || 'Non spécifié'}</span>
                  </div>
                  <div className="detail">
                    <span className="icon">📅</span>
                    <span>Du {formatDate(annonce.date_debut)} au {formatDate(annonce.date_fin)}</span>
                  </div>
                </div>
              </div>
              
              <div className="annonce-actions">
                <button 
                  className="postuler-btn"
                  onClick={() => handlePostulerClick(annonce)}
                >
                  Postuler
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>Aucune annonce disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}