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
  const [newAnnonce, setNewAnnonce] = useState({
    titre: "",
    description: "",
    lieu: "",
    type: "EVENEMENT",
    date_debut: "",
    date_fin: "",
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAnnonce({ ...newAnnonce, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post("http://127.0.0.1:8000/api/annonces/", newAnnonce, { headers });
      toast.success("Annonce ajoutée avec succès!");
      setShowModal(false);
      fetchAnnonces();
      setNewAnnonce({
        titre: "",
        description: "",
        lieu: "",
        type: "EVENEMENT",
        date_debut: "",
        date_fin: "",
      });
    } catch (err) {
      toast.error("Erreur lors de l'ajout de l'annonce");
      console.error(err);
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
        <button className="create-post-btn" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> Créer une annonce
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="post-modal">
            <div className="modal-header">
              <h2>Créer une annonce</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  name="titre"
                  value={newAnnonce.titre}
                  onChange={handleInputChange}
                  placeholder="Titre de l'annonce"
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  name="description"
                  value={newAnnonce.description}
                  onChange={handleInputChange}
                  placeholder="Quoi de neuf ?"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Lieu</label>
                  <input
                    type="text"
                    name="lieu"
                    value={newAnnonce.lieu}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    name="type"
                    value={newAnnonce.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="EVENEMENT">Événement</option>
                    <option value="BESOIN">Besoin</option>
                    <option value="OFFRE">Offre</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date de début</label>
                  <input
                    type="datetime-local"
                    name="date_debut"
                    value={newAnnonce.date_debut}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date de fin</label>
                  <input
                    type="datetime-local"
                    name="date_fin"
                    value={newAnnonce.date_fin}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="post-submit-btn">
                  Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="posts-container">
        {annonces.length > 0 ? (
          annonces.map((annonce) => (
            <div className="post-card" key={annonce.id}>
              <div className="post-header">
                <div className="user-info">
                  <img 
                    src={annonce.association.logo || '/default-avatar.png'} 
                    alt={annonce.association.nom} 
                    className="user-avatar"
                  />
                  <div>
                    <h3>{annonce.association.nom}</h3>
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
            <button onClick={() => setShowModal(true)}>Soyez le premier à poster</button>
          </div>
        )}
      </div>
    </div>
  );
}