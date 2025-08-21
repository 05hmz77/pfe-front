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
  const [categories, setCategories] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [newAnnonce, setNewAnnonce] = useState({
    titre: "",
    description: "",
    lieu: "",
    categorie: "",
    date_debut: "",
    date_fin: "",
    image: null,
    type: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      const [annoncesRes, categoriesRes, associationsRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/annonces/", { headers }),
        axios.get("http://127.0.0.1:8000/api/categories/", { headers }),
        axios.get("http://127.0.0.1:8000/api/associations/", { headers }),
      ]);

      setAnnonces(annoncesRes.data);
      setCategories(categoriesRes.data);
      setAssociations(associationsRes.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAnnonce({ ...newAnnonce, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewAnnonce({ ...newAnnonce, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      const formData = new FormData();
      formData.append("titre", newAnnonce.titre);
      formData.append("description", newAnnonce.description);
      formData.append("lieu", newAnnonce.lieu);
      formData.append("categorie", newAnnonce.categorie);
      formData.append("date_debut", newAnnonce.date_debut);
      formData.append("date_fin", newAnnonce.date_fin);
      formData.append("type", newAnnonce.type);
      if (newAnnonce.image) {
        formData.append("image", newAnnonce.image);
      }

      await axios.post("http://127.0.0.1:8000/api/annonces/", formData, {
        headers,
      });
      toast.success("Annonce ajoutée avec succès!");
      setShowModal(false);
      fetchData();
      resetForm();
    } catch (err) {
      toast.error("Erreur lors de l'ajout de l'annonce");
      console.error(err);
    }
  };

  const resetForm = () => {
    setNewAnnonce({
      titre: "",
      description: "",
      lieu: "",
      categorie: "",
      date_debut: "",
      date_fin: "",
      image: null,
      association: "",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifié";
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("fr-FR", options);
  };

  const getCategoryClassName = (idCategorie) => {
  if (!idCategorie) return 'default';
  const categorie = categories.find(cat => cat.id === idCategorie);
  return categorie ? categorie.nom.toLowerCase().replace(/\s+/g, '-') : 'default';
};

const getCategoryDisplayName = (idCategorie) => {
  if (!idCategorie) return null;
  const categorie = categories.find(cat => cat.id === idCategorie);
  return categorie?.nom || null;
};

  if (loading) return <div className="loading">Chargement en cours...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

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
                  placeholder="Description"
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
                  <label>Catégorie</label>
                  <select
                    name="categorie"
                    value={newAnnonce.categorie}
                    onChange={handleInputChange}
                    
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nom}
                      </option>
                    ))}
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
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>type</label>
                  <select
                    name="type"
                    value={newAnnonce.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionnez une association</option>
                    <option value="EVENEMENT">EVENEMENT</option>
                    <option value="DON">DON</option>
                    <option value="APPEL_BENEVOLAT">APPEL_BENEVOLAT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="image-upload" className="file-upload-label">
                    <i className="fas fa-image"></i> Choisir une image
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      className="file-input"
                    />
                  </label>
                  {newAnnonce.image && (
                    <span className="file-name">{newAnnonce.image.name}</span>
                  )}
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
                  {annonce.association?.logo && (
                    <img
                      src={`http://localhost:8000/media/${annonce.association.logo}`}
                      onError={(e) => (e.target.src = "/profile.jpg")}
                      alt="Logo association"
                      className="association-logo"
                    />
                  )}
                  <div>
                    <h3>
                      {annonce.association?.nom || "Association inconnue"}
                    </h3>
                    <span className="post-time">
                      {formatDate(annonce.date_creation)}
                    </span>
                  </div>
                </div>

                <div className="post-type-badge">
                  <span className={`badge ${getCategoryClassName(annonce.categorie)}`}>
  {getCategoryDisplayName(annonce.categorie) || "Non catégorisé"}
</span>
                </div>
              </div>

              <div className="post-content">
                <h2 className="post-title">{annonce.titre}</h2>
                <p className="post-text">{annonce.description}</p>

                {annonce.image && (
                  <div className="post-image-container">
                    <img
                      src={`${annonce.image}`}
                      onError={(e) => (e.target.src = "/annonce.jpg")}
                      alt="Annonce"
                      className="post-image"
                    />
                  </div>
                )}

                <div className="post-details">
                  <div className="detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{annonce.lieu || "Non spécifié"}</span>
                  </div>
                  <div className="detail-item">
                    <i className="far fa-calendar-alt"></i>
                    <span>Début: {formatDate(annonce.date_debut)}</span>
                  </div>
                  {annonce.date_fin && (
                    <div className="detail-item">
                      <i className="far fa-calendar-check"></i>
                      <span>Fin: {formatDate(annonce.date_fin)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-feed">
            <p>Aucune annonce disponible pour le moment</p>
            <button onClick={() => setShowModal(true)}>
              Soyez le premier à poster
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
