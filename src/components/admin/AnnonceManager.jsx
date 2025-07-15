import React, { useState, useEffect } from "react";
import axios from "axios";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import toast, { Toaster } from "react-hot-toast";
import "./style/AnnonceManager.css";

const AnnonceManager = () => {
  const [annonces, setAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    categorie: "",
    search: "",
  });

  const token = localStorage.getItem("accessToken");

  const TYPES = {
    EVENEMENT: "Évènement",
    DON: "Don",
    APPEL_BENEVOLAT: "Appel au bénévolat",
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      const [annoncesRes, categoriesRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/annonces/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://127.0.0.1:8000/api/categories/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setAnnonces(annoncesRes.data);
      setCategories(categoriesRes.data);
      setLoading(false);
      toast.success("Données chargées avec succès");
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast.error("Erreur lors du chargement des données");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Delete an announcement
  const handleDelete = (id) => {
    confirmAlert({
      title: "Confirmer la suppression",
      message: "Êtes-vous sûr de vouloir supprimer cette annonce ?",
      buttons: [
        {
          label: "Oui",
          onClick: async () => {
            try {
              await axios.delete(`http://127.0.0.1:8000/api/annonces/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setAnnonces(annonces.filter((annonce) => annonce.id !== id));
              toast.success("Annonce supprimée avec succès");
            } catch (err) {
              setError("Erreur lors de la suppression");
              toast.error("Échec de la suppression de l'annonce");
            }
          },
        },
        {
          label: "Non",
          onClick: () => {},
        },
      ],
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Filter announcements
  const filteredAnnonces = annonces.filter((annonce) => {
    const matchesType = !filters.type || annonce.type === filters.type;
    const matchesCategorie =
      !filters.categorie ||
      (annonce.categorie !== null &&
        annonce.categorie.toString() === filters.categorie);
    const matchesSearch =
      !filters.search ||
      annonce.titre.toLowerCase().includes(filters.search.toLowerCase()) ||
      annonce.description.toLowerCase().includes(filters.search.toLowerCase());

    return matchesType && matchesCategorie && matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <svg
            className="error-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3>Erreur</h3>
        </div>
        <p>{error}</p>
        <button onClick={fetchData} className="retry-btn">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="annonce-container">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "14px",
          },
        }}
      />

      <div className="annonce-header">
        <h1 className="annonce-title">Liste des Annonces</h1>

        <div className="filters-container">
          <div className="search-input-container">
            <input
              type="text"
              name="search"
              placeholder="Rechercher..."
              className="search-input"
              value={filters.search}
              onChange={handleFilterChange}
            />
            <svg
              className="search-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="select-filters">
            <select
              name="type"
              className="filter-select"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">Tous les types</option>
              {Object.entries(TYPES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>

            <select
              name="categorie"
              className="filter-select"
              value={filters.categorie}
              onChange={handleFilterChange}
            >
              <option value="">Toutes catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredAnnonces.length === 0 ? (
        <div className="empty-state">
          <svg
            className="empty-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3>Aucune annonce disponible</h3>
          <p>Aucune annonce ne correspond à vos critères de recherche.</p>
        </div>
      ) : (
        <div className="annonce-list">
          {filteredAnnonces.map((annonce) => (
            <div key={annonce.id} className="annonce-card">
              {/* Image principale de l'annonce */}
              <div className="annonce-image-container">
                {annonce.image ? (
                  <img
                    src={annonce.image}
                    alt={annonce.titre}
                    className="annonce-image"
                    onError={(e) => {
                      e.target.src = "/association.jpg";
                      e.target.onerror = null; // Empêche les boucles d'erreur
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
                    <span
                      className={`annonce-type ${annonce.type.toLowerCase()}`}
                    >
                      {TYPES[annonce.type] || annonce.type}
                    </span>
                    {annonce.categorie && (
                      <span className="annonce-category">
                        {
                          categories.find((c) => c.id === annonce.categorie)
                            ?.nom
                        }
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

                  <div className="annonce-footer">
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

                    <button
                      onClick={() => handleDelete(annonce.id)}
                      className="delete-btn"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnonceManager;
