// MyAnnonces.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style/ListAnnonces.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MyAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [candidatures, setCandidatures] = useState({});
  const [selectedAnnonceId, setSelectedAnnonceId] = useState(null);
  const curentUser = JSON.parse(localStorage.getItem("user"));
  const [loading, setLoading] = useState(true);
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
      const response = await axios.get("http://127.0.0.1:8000/api/annonces/", {
        headers,
      });
      setAnnonces(
        response.data.filter((i) => i.association.id === curentUser.id)
      );
      setLoading(false);
    } catch (err) {
      toast.error("Erreur lors du chargement des annonces");
      setLoading(false);
    }
  };

  const fetchCandidatures = async (annonceId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get("http://127.0.0.1:8000/api/candidatures/mes/", { headers });
      const filtered = response.data.filter((c) => c.annonce === annonceId);
      setCandidatures((prev) => ({ ...prev, [annonceId]: filtered }));
      setSelectedAnnonceId(annonceId);
    } catch (err) {
      toast.error("Erreur lors du chargement des candidatures");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="annonces-container">
      <ToastContainer />
      <div className="header">
        <h1>Mes Annonces</h1>
        <button onClick={() => setShowModal(true)}>+ Nouvelle Annonce</button>
      </div>

      {annonces.length > 0 ? (
        annonces.map((annonce) => (
          <div className="annonce-card" key={annonce.id}>
            <div className="annonce-header">
              <img src={annonce.association.logo || "/default-avatar.png"} alt="logo" />
              <div>
                <h3>{annonce.titre}</h3>
                <p>{formatDate(annonce.date_creation)}</p>
              </div>
              <span className={`badge badge-${annonce.type.toLowerCase()}`}>
                {annonce.type}
              </span>
            </div>

            <div className="annonce-body">
              <p>{annonce.description}</p>
              <p><strong>Lieu :</strong> {annonce.lieu}</p>
              <p><strong>Du :</strong> {formatDate(annonce.date_debut)} au {formatDate(annonce.date_fin)}</p>
            </div>

            <button onClick={() => fetchCandidatures(annonce.id)} className="btn-candidatures">
              Voir les candidatures
            </button>

            {selectedAnnonceId === annonce.id && candidatures[annonce.id] && (
              <div className="candidatures-section">
                {candidatures[annonce.id].length > 0 ? (
                  candidatures[annonce.id].map((c) => (
                    <div className="candidature-card" key={c.id}>
                      <p><strong>ID:</strong> {c.id}</p>
                      <p><strong>Message:</strong> {c.message}</p>
                      <p><strong>Date:</strong> {formatDate(c.date_candidature)}</p>
                      <p><strong>Statut:</strong> {c.statut}</p>
                    </div>
                  ))
                ) : (
                  <p>Aucune candidature pour cette annonce.</p>
                )}
              </div>
            )}
          </div>
        ))
      ) : (
        <p>Aucune annonce disponible.</p>
      )}
    </div>
  );
}
