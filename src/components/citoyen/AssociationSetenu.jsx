import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style/AssociationSoutenue.css";

const AssociationSoutenue = () => {
  const navigate = useNavigate();
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssociation, setSelectedAssociation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState("");
  const [contenu, setContenu] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const token = localStorage.getItem("accessToken");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchAssociationsSoutenues = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [candidaturesRes, annoncesRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/candidatures/mes/", { headers }),
          axios.get("http://localhost:8000/api/annonces/", { headers })
        ]);

        const acceptedApplications = candidaturesRes.data.filter(
          c => c.statut === "ACCEPTEE"
        );

        const supportedAssociations = acceptedApplications
          .map(c => {
            const annonce = annoncesRes.data.find(a => a.id === c.annonce);
            return annonce?.association;
          })
          .filter(asso => asso !== undefined && asso !== null)
          .reduce((unique, item) => {
            return unique.some(u => u.id === item.id) ? unique : [...unique, item];
          }, []);

        setAssociations(supportedAssociations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssociationsSoutenues();
  }, [token]);

  const showAssociationDetails = association => {
    setSelectedAssociation(association);
    setNote("");
    setContenu("");
    setFeedbackMessage(null);
    setShowFeedbackForm(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSendFeedback = async () => {
    if (!note || !contenu) {
      setFeedbackMessage("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `http://localhost:8000/api/feedback/${selectedAssociation.user}/`,
        { note, contenu },
        { headers }
      );
      setFeedbackMessage("Feedback envoyé avec succès !");
      setShowFeedbackForm(false);
    } catch (error) {
      setFeedbackMessage(
        error.response?.data?.detail || "Erreur lors de l'envoi du feedback."
      );
    }
  };

  const navigateToChat = () => {
    navigate("/welcome/citoyen/chat", { state: { user: selectedAssociation } });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement en cours...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">Erreur: {error}</div>;
  }

  return (
    <div className="association-container">
      <header className="association-header">
        <h1>Vos Associations Soutenues</h1>
        <p className="subtitle">
          Retrouvez ici toutes les associations que vous soutenez activement
        </p>
      </header>

      {associations.length === 0 ? (
        <div className="empty-state">
          <img
            src="/illustrations/no-associations.svg"
            alt="Aucune association"
            className="empty-image"
          />
          <h3>Vous ne soutenez aucune association pour le moment</h3>
          <p>
            Participez à des missions pour soutenir des associations et elles
            apparaîtront ici.
          </p>
          <button className="cta-button">Découvrir des missions</button>
        </div>
      ) : (
        <div className="association-grid">
          {associations.map(association => (
            <div key={association.id} className="association-card">
              <div className="card-header">
                <img
                  src={`http://localhost:8000/media/${association.logo}`}
                  onError={e => (e.target.src = "/profile.jpg")}
                  alt={`Logo ${association.nom}`}
                  className="association-logo"
                />
                <div className="association-info">
                  <h3>{association.nom}</h3>
                  <span className="badge accepted">Soutenu</span>
                </div>
              </div>

              <div className="card-body">
                <p className="association-description">
                  {association.description || "Aucune description disponible."}
                </p>

                <div className="association-meta">
                  <div className="meta-item">
                    <span className="meta-label">Contact</span>
                    <span>{association.contact || "Non disponible"}</span>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button
                  onClick={() => showAssociationDetails(association)}
                  className="action-button details"
                >
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedAssociation && (
        <div className="modal-backdrop">
          <div className="modal-content">
            

            <div className="modal-header">
              <img
                src={`http://localhost:8000/media/${selectedAssociation.logo}`}
                onError={e => (e.target.src = "/profile.jpg")}
                alt="Logo association"
                className="modal-logo"
              />
              <h2>{selectedAssociation.nom}</h2>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>Description</h3>
                <p>{selectedAssociation.description || "Non disponible"}</p>
              </div>

              <div className="modal-section">
                <h3>Coordonnées</h3>
                <div className="contact-info">
                  <div>
                    <strong>Contact:</strong>{" "}
                    {selectedAssociation.contact || "Non disponible"}
                  </div>
                  <div>
                    <strong>Email:</strong> {currentUser.email || "Non disponible"}
                  </div>
                  {selectedAssociation.site_web && (
                    <div>
                      <strong>Site web:</strong>{" "}
                      <a
                        href={selectedAssociation.site_web}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {selectedAssociation.site_web}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {selectedAssociation.reseaux_sociaux && (
                <div className="modal-section">
                  <h3>Réseaux sociaux</h3>
                  <div className="social-links">
                    {Object.entries(
                      JSON.parse(selectedAssociation.reseaux_sociaux)
                    ).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                      >
                        {platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!showFeedbackForm ? (
                <div className="action-buttons">
                  <button
                    onClick={navigateToChat}
                    className="action-button primary"
                  >
                    Envoyer un message
                  </button>
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="action-button secondary"
                  >
                    Donner votre avis
                  </button>
                  <button
                   onClick={closeModal}
                    className="action-button darck"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <div className="feedback-form">
                  <h3>Votre évaluation</h3>
                  <div className="form-group">
                    <label>Note (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Commentaire</label>
                    <textarea
                      value={contenu}
                      onChange={e => setContenu(e.target.value)}
                      placeholder="Dites-nous ce que vous pensez de cette association..."
                    />
                  </div>
                  {feedbackMessage && (
                    <div className="feedback-message">{feedbackMessage}</div>
                  )}
                  <div className="form-actions">
                    <button
                      onClick={handleSendFeedback}
                      className="action-button primary"
                    >
                      Envoyer
                    </button>
                    <button
                      onClick={() => setShowFeedbackForm(false)}
                      className="action-button secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociationSoutenue;