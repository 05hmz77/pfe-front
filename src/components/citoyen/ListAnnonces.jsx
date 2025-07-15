import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style/ListAnnonces.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TYPES = {
  BENEVOLAT: "Bénévolat",
  DON: "Don",
  EVENEMENT: "Événement"
};

export default function ListAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [message, setMessage] = useState("");
  const curentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { Authorization: `Bearer ${token}` };
        
        // Récupérer les annonces et catégories en parallèle
        const [annoncesRes, categoriesRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/annonces/", { headers }),
          axios.get("http://127.0.0.1:8000/api/categories/", { headers })
        ]);

        setAnnonces(annoncesRes.data);
        setCategories(categoriesRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        toast.error("Erreur lors du chargement des données");
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("fr-FR", options);
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
        date_candidature: new Date().toISOString(),
        citoyen: curentUser.id
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

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.nom : "Non catégorisé";
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
              <button className="btn primary" onClick={handleSubmitCandidature}>
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
            <div key={annonce.id} className="annonce-card">
              <div className="annonce-image-container">
                {annonce.image ? (
                  <img
                    src={annonce.image}
                    alt={annonce.titre}
                    className="annonce-image"
                    onError={(e) => {
                      e.target.src = "/association.jpg";
                      e.target.onerror = null;
                    }}
                  />
                ) : (
                  <img
                    src="/association.jpg"
                    alt={annonce.titre}
                    className="annonce-image"
                  />
                )}
              </div>

              <div className="annonce-content">
                <div className="annonce-header-card">
                  {annonce.association.logo ? (
                    <img
                      src={`http://localhost:8000/media/${annonce.association.logo}`}
                      onError={(e) => (e.target.src = "/profile.jpg")}
                      alt="Logo association"
                      className="modal-img"
                    />
                  ) : (
                    <div className="default-logo">
                      <span>No Logo</span>
                    </div>
                  )}
                  <div>
                    <h3 className="association-name">
                      {annonce.association.nom}
                    </h3>
                    <p className="association-contact">
                      {annonce.association.contact}
                    </p>
                  </div>
                </div>

                <div className="annonce-body">
                  <div className="annonce-meta">
                    <span className={`annonce-type ${annonce.type.toLowerCase()}`}>
                      {TYPES[annonce.type] || annonce.type}
                    </span>
                    {annonce.categorie && (
                      <span className="annonce-category">
                        {getCategoryName(annonce.categorie)}
                      </span>
                    )}
                  </div>

                  <h2 className="annonce-title-card">{annonce.titre}</h2>
                  <p className="annonce-description">{annonce.description}</p>

                  <div className="annonce-dates">
                    <div className="date-item">
                      <svg
                        className="date-icon"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Début: {formatDate(annonce.date_debut)}</span>
                    </div>
                    <div className="date-item">
                      <svg
                        className="date-icon"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Fin: {formatDate(annonce.date_fin)}</span>
                    </div>
                  </div>

                  <div className="annonce-location">
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{annonce.lieu}</span>
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