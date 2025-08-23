import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style/ListAnnonces.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TYPES = {
  BENEVOLAT: "Bénévolat",
  DON: "Don",
  EVENEMENT: "Événement",
};

const REACTIONS = [
  { type: "LIKE", label: "👍" },
  { type: "JADORE", label: "❤️" },
  { type: "SAD", label: "😢" },
  { type: "ANGRY", label: "😡" },
];

export default function ListAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [commentaires, setCommentaires] = useState({});
  const [newComment, setNewComment] = useState({});
  const [reactions, setReactions] = useState({});

  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [annoncesRes, categoriesRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/annonces/", { headers }),
          axios.get("http://127.0.0.1:8000/api/categories/", { headers }),
        ]);

        setAnnonces(annoncesRes.data);
        setCategories(categoriesRes.data);

        annoncesRes.data.forEach((annonce) => {
          fetchCommentaires(annonce.id);
          fetchReactions(annonce.id);
        });

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        toast.error("Erreur lors du chargement des données");
      }
    };

    fetchData();
  }, []);

  // --- 🔹 Récupérer commentaires ---
  const fetchCommentaires = async (annonceId) => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/annonces/${annonceId}/commentaires/`,
        { headers }
      );
      setCommentaires((prev) => ({ ...prev, [annonceId]: res.data }));
    } catch (err) {
      console.error(
        "Erreur chargement commentaires",
        err.response?.data || err
      );
    }
  };

  // --- 🔹 Récupérer réactions ---
  const fetchReactions = async (annonceId) => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/annonces/${annonceId}/reactions/`,
        { headers }
      );
      setReactions((prev) => ({ ...prev, [annonceId]: res.data }));
    } catch (err) {
      console.error("Erreur chargement réactions", err.response?.data || err);
    }
  };

  // --- 🔹 Ajouter une réaction ---
  const handleReaction = async (annonceId, type) => {
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/annonces/${annonceId}/reactions/`,
        { type },
        { headers }
      );
      fetchReactions(annonceId);
    } catch (err) {
      toast.error("Erreur lors de la réaction");
      console.error(err.response?.data || err);
    }
  };

  // --- 🔹 Ajouter un commentaire ---
  const handleCommentSubmit = async (annonceId) => {
    if (!newComment[annonceId]) return;

    try {
      await axios.post(
        `http://127.0.0.1:8000/api/annonces/${annonceId}/commentaires/`,
        { contenu: newComment[annonceId] }, // ✅ juste contenu
        { headers }
      );
      setNewComment((prev) => ({ ...prev, [annonceId]: "" }));
      fetchCommentaires(annonceId);
    } catch (err) {
      toast.error("Erreur lors de l'ajout du commentaire");
      console.error(err.response?.data || err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.nom : "Non catégorisé";
  };

  if (loading) return <div className="loading-screen">Chargement...</div>;
  if (error) return <div className="error-screen">Erreur: {error}</div>;

  return (
    <div className="annonces-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <header className="page-header">
        <h1>Annonces disponibles</h1>
      </header>

      <div className="annonces-grid">
        {annonces.map((annonce) => (
          <div key={annonce.id} className="annonce-card">
            <h2>{annonce.titre}</h2>
            <p>{annonce.description}</p>
            <span className="annonce-type">
              {TYPES[annonce.type] || annonce.type}
            </span>
            <span className="annonce-category">
              {getCategoryName(annonce.categorie)}
            </span>
            <p>
              📍 {annonce.lieu} <br />
              🗓 {formatDate(annonce.date_debut)} -{" "}
              {formatDate(annonce.date_fin)}
            </p>

            {/* ✅ Réactions */}
            <div className="reactions">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => handleReaction(annonce.id, r.type)}
                >
                  {r.label}{" "}
                  {
                    (reactions[annonce.id] || []).filter(
                      (react) => react.type === r.type
                    ).length
                  }
                </button>
              ))}
            </div>

            {/* ✅ Commentaires */}
            <div className="comments-section">
              <h4>Commentaires</h4>
              {(commentaires[annonce.id] || []).map((c) => (
                <div key={c.id} className="comment">
                  <strong>{c.auteur?.username || "Anonyme"}</strong> :{" "}
                  {c.contenu}
                </div>
              ))}

              <div className="comment-form">
                <input
                  type="text"
                  placeholder="Ajouter un commentaire..."
                  value={newComment[annonce.id] || ""}
                  onChange={(e) =>
                    setNewComment((prev) => ({
                      ...prev,
                      [annonce.id]: e.target.value,
                    }))
                  }
                />
                <button onClick={() => handleCommentSubmit(annonce.id)}>
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
