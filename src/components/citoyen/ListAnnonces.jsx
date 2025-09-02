import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style/ListAnnonces.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from "react-icons/fa";

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
  const [editingComment, setEditingComment] = useState(null); // {id, annonceId, contenu}
  const [reactions, setReactions] = useState({});
  const [showComments, setShowComments] = useState({});

  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user"));
  const [userId, setUserId] = useState(user?.id || ""); // 👈 ID utilisateur connecté
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    alert(userId);
    setUserId(user.id);
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

  // 🔹 Ajouter / Modifier / Supprimer une réaction
  const handleReaction = async (annonceId, type) => {
    try {
      const existing = (reactions[annonceId] || []).find(
        (r) => r.utilisateur === userId
      );

      if (existing) {
        if (existing.type === type) {
          await axios.delete(
            `http://127.0.0.1:8000/api/reactions/${existing.id}/`,
            { headers }
          );
        } else {
          await axios.put(
            `http://127.0.0.1:8000/api/reactions/${existing.id}/`,
            { type },
            { headers }
          );
        }
      } else {
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

  // 🔹 Supprimer un commentaire
  const handleDeleteComment = async (annonceId, commentId) => {
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/commentaires/${commentId}/`,
        {
          headers,
        }
      );
      fetchCommentaires(annonceId);
      toast.success("Commentaire supprimé");
    } catch (err) {
      toast.error("Erreur lors de la suppression");
      console.error(err.response?.data || err);
    }
  };

  // 🔹 Activer mode édition
  const handleEditComment = (annonceId, commentId, contenu) => {
    setEditingComment({ id: commentId, annonceId, contenu });
  };

  // 🔹 Sauvegarder modification commentaire
  const handleSaveEdit = async () => {
    if (!editingComment) return;
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/commentaires/${editingComment.id}/`,
        { contenu: editingComment.contenu },
        { headers }
      );
      fetchCommentaires(editingComment.annonceId);
      setEditingComment(null);
      toast.success("Commentaire modifié");
    } catch (err) {
      toast.error("Erreur lors de la modification");
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
      {annonces.map((annonce) => {
        const userReaction = (reactions[annonce.id] || []).find(
          (r) => r.utilisateur === userId
        );

        return (
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
                  className={
                    userReaction?.type === r.type ? "active-reaction" : ""
                  }
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
                💬 Commentaires ({(commentaires[annonce.id] || []).length || 0})
              </button>
            </div>

            {/* 🔹 Commentaires */}
            {showComments[annonce.id] && (
              <div className="post-comments">
                {(commentaires[annonce.id] || []).map((c) => (
                  <div key={c.id} className="comment">
                    <strong>{c.auteur?.username || "Anonyme"}</strong> :{" "}
                    {editingComment?.id === c.id ? (
                      <input
                        type="text"
                        value={editingComment.contenu}
                        onChange={(e) =>
                          setEditingComment((prev) => ({
                            ...prev,
                            contenu: e.target.value,
                          }))
                        }
                        onBlur={handleSaveEdit}
                      />
                    ) : (
                      c.contenu
                    )}
                    {c.auteur?.id === userId && (
                      <span className="comment-actions">
                        <FaEdit
                          className="edit-icon"
                          onClick={() =>
                            handleEditComment(annonce.id, c.id, c.contenu)
                          }
                        />
                        <FaTrash
                          className="delete-icon"
                          onClick={() => handleDeleteComment(annonce.id, c.id)}
                        />
                      </span>
                    )}
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
        );
      })}
    </div>
  );
}
