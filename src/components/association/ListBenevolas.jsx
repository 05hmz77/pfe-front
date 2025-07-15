import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style/ListBenevoles.css";
import { useNavigate } from "react-router-dom";

const ListBenevoles = () => {

  const navigate=useNavigate()
  const [benevoles, setBenevoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBenevole, setSelectedBenevole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState("");
  const [contenu, setContenu] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const token = localStorage.getItem("accessToken");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchBenevolesAcceptes = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(
          "http://127.0.0.1:8000/api/candidatures/mes/",
          {
            headers,
          }
        );

        // Filtrer seulement les candidatures avec statut ACCEPTEE
        const candidaturesAcceptees = response.data.filter(
          (c) => c.statut === "ACCEPTEE"
        );
        console.log(candidaturesAcceptees);
        // Grouper par bénévole pour éviter les doublons
        const benevolesUniques = {};

        candidaturesAcceptees.forEach((candidature) => {
          console.log(candidature);

          const citoyenId = candidature.citoyen;
          const details = candidature.citoyen_details;

          if (!details) {
            console.warn(
              `citoyen_details manquant pour la candidature ${candidature.id}`
            );
            return; // Ignore cette candidature si pas de détails
          }

          if (!benevolesUniques[citoyenId]) {
            benevolesUniques[citoyenId] = {
              ...details,
              id: citoyenId,
              user_id: details.user,
              candidatures: [candidature],
            };
          } else {
            benevolesUniques[citoyenId].candidatures.push(candidature);
          }
        });

        setBenevoles(Object.values(benevolesUniques));
      } catch (err) {
        alert(1);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBenevolesAcceptes();
  }, [token]);

  const showEvaluationModal = (benevole) => {
    setSelectedBenevole(benevole);
    setNote("");
    setContenu("");
    setFeedbackMessage(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const envoyerMsg=(benevole)=>{
    
    navigate("/welcome/association/chat",{state:{user:benevole}})
   }

  const handleSendFeedback = async () => {
    if (!note || !contenu) {
      setFeedbackMessage("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `http://localhost:8000/api/feedback/${selectedBenevole.user_id}/`,
        { note, contenu },
        { headers }
      );
      setFeedbackMessage("Évaluation envoyée avec succès !");
      // Mettre à jour la note d'engagement dans la liste
      setBenevoles((prev) =>
        prev.map((b) =>
          b.id === selectedBenevole.id ? { ...b, note_engagement: note } : b
        )
      );
    } catch (error) {
      if (error.response?.data?.detail) {
        setFeedbackMessage(error.response.data.detail);
      } else {
        setFeedbackMessage("Erreur lors de l'envoi de l'évaluation.");
      }
    }
  };

  if (loading) {
    return <div className="loading-benevoles">Chargement en cours...</div>;
  }

  if (error) {
    return <div className="error-benevoles">Erreur: {error}</div>;
  }

  return (
    <div className="liste-benevoles-container">
      <header className="page-header">
        <h1 className="page-title">👥 Vos Bénévoles Acceptés</h1>
        <p className="page-subtitle">
          Voici les bénévoles qui ont rejoint vos missions
        </p>
      </header>

      {benevoles.length === 0 ? (
        <div className="empty-state">
          <img src="/no-data.svg" alt="Aucun bénévole" className="empty-img" />
          <p className="empty-text">Aucun bénévole accepté pour le moment.</p>
        </div>
      ) : (
        <section className="benevoles-grid">
          {benevoles.map((benevole) => (
            <div key={benevole.id} className="benevole-card">
              <div className="benevole-header">
                <img
                  src={
                    benevole.album_photos &&
                    JSON.parse(benevole.album_photos).length > 0
                      ? `http://127.0.0.1:8000/${
                          JSON.parse(benevole.album_photos)[0]
                        }`
                      : "/profile.jpg"
                  }
                  onError={(e) => (e.target.src = "/profile.jpg")}
                  className="benevole-img"
                  alt={`${benevole.nom} ${benevole.prenom}`}
                />
                <div>
                  <h3 className="benevole-name">
                    {benevole.nom} {benevole.prenom}
                  </h3>
                  <span className="statut acceptee">Accepté</span>
                </div>
              </div>

              <div className="benevole-info">
                <p className="benevole-bio">
                  {benevole.bio || "Aucune bio disponible"}
                </p>
                <p className="benevole-experience">
                  <strong>Expérience:</strong>{" "}
                  {benevole.experiences || "Non spécifiée"}
                </p>

                <div className="candidatures-list">
                  <h4>Missions acceptées:</h4>
                  {benevole.candidatures.map((candidature) => (
                    <div key={candidature.id} className="candidature-item">
                      <p>
                        <strong>Message:</strong> {candidature.message}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(
                          candidature.date_candidature
                        ).toLocaleDateString()}
                      </p>
                      {candidature.note_engagement && (
                        <p>
                          <strong>Note:</strong> {candidature.note_engagement}
                          /10
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="benevole-actions">
                <button
                  onClick={() => showEvaluationModal(benevole)}
                  className="evaluer-btn"
                >
                  Évaluer
                </button>
                <button className="message-btn" onClick={()=>{envoyerMsg(benevole)}} >Envoyer message</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Modal d'évaluation */}
      {showModal && selectedBenevole && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            <div className="modal-header">
              <img
                src={
                  selectedBenevole.album_photos &&
                  JSON.parse(selectedBenevole.album_photos).length > 0
                    ? `http://127.0.0.1:8000/${
                        JSON.parse(selectedBenevole.album_photos)[0]
                      }`
                    : "/profile.jpg"
                }
                onError={(e) => (e.target.src = "/profile.jpg")}
                alt={`${selectedBenevole.nom} ${selectedBenevole.prenom}`}
                className="modal-img"
              />
              <h2>
                {selectedBenevole.nom} {selectedBenevole.prenom}
              </h2>
            </div>

            <div className="modal-body">
              <p>
                <strong>Bio:</strong> {selectedBenevole.bio || "Non disponible"}
              </p>
              <p>
                <strong>Expérience:</strong>{" "}
                {selectedBenevole.experiences || "Non disponible"}
              </p>

              <hr />
              <h3>Évaluer ce bénévole</h3>
              <div className="feedback-form">
                <div className="form-group">
                  <label>Note sur 10:</label>
                  <input
                    type="number"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="form-group">
                  <label>Commentaire:</label>
                  <textarea
                    value={contenu}
                    onChange={(e) => setContenu(e.target.value)}
                    placeholder="Votre évaluation..."
                  ></textarea>
                </div>
                {feedbackMessage && (
                  <p className="feedback-msg">{feedbackMessage}</p>
                )}
                <button className="send-btn" onClick={handleSendFeedback}>
                  Envoyer l'évaluation
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="close-btn" onClick={closeModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListBenevoles;
