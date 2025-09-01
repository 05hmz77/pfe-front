import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style/ListAnnonces.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TYPES = {
  BENEVOLAT: "🤝 Bénévolat",
  DON: "🎁 Don",
  EVENEMENT: "📅 Événement",
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
  const [showComments, setShowComments] = useState({});

  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId"); // 👈 id utilisateur connecté
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

  // 🔹 Commentaires
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

  // 🔹 Réactions
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

  // 🔹 Ajouter ou modifier une réaction
  const handleReaction = async (annonceId, type) => {
    try {
      const existing = (reactions[annonceId] || [])
      if (existing) {
        // Modifier reaction existante
         await axios.put(
    `http://127.0.0.1:8000/api/annonces/${annonceId}/reactions/${existing.id}/`,
    { type },
    { headers }
  );
      } else {
        // Ajouter nouvelle reaction
        await axios.post(
          `http://127.0.0.1:8000/api/annonces/${annonceId}/reactions/`,
          { type },
          { headers }
        );
      }

      fetchReactions(annonceId);
    } catch (err) {
      toast.error("Erreur lors de la réaction");
      console.error(err.response?.data || err);
    }
  };

  // 🔹 Ajouter un commentaire
  const handleCommentSubmit = async (annonceId) => {
    if (!newComment[annonceId]) return;
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/annonces/${annonceId}/commentaires/`,
        { contenu: newComment[annonceId] },
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
      month: "short",
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
    <div className="feed-container">
      <ToastContainer position="top-right" autoClose={3000} />
      {annonces.map((annonce) => (
        <div key={annonce.id} className="post-card">
          {/* 🔹 Header */}
          <div className="post-header">
            <img
              src={`http://127.0.0.1:8000/media/${annonce.association.logo}`}
              alt="logo"
              className="post-logo"
            />
            <div>
              <h3>{annonce.association.nom}</h3>
              <span className="post-date">
                {formatDate(annonce.date_creation)} ·{" "}
                {TYPES[annonce.type] || annonce.type}
              </span>
            </div>
          </div>

          {/* 🔹 Contenu */}
          <div className="post-content">
            <h2>{annonce.titre}</h2>
            <p>{annonce.description}</p>
            <div className="image-wrapper">
              <img src={annonce.image} alt="annonce" className="post-image" />
            </div>
          </div>

          {/* 🔹 Infos */}
          <div className="post-info">
            <span className="category">
              {getCategoryName(annonce.categorie)}
            </span>
            <span>📍 {annonce.lieu}</span>
            <span>
              🗓 {formatDate(annonce.date_debut)} -{" "}
              {formatDate(annonce.date_fin)}
            </span>
          </div>

          {/* 🔹 Réactions */}
          <div className="post-reactions">
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
            <button
              className="toggle-comments"
              onClick={() =>
                setShowComments((prev) => ({
                  ...prev,
                  [annonce.id]: !prev[annonce.id],
                }))
              }
            >
              💬 Commentaires
            </button>
          </div>

          {/* 🔹 Commentaires */}
          {showComments[annonce.id] && (
            <div className="post-comments">
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
          )}
        </div>
      ))}
    </div>
  );
}
