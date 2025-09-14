// ListAnnonces.jsx — Style simplifié façon Facebook/Instagram (sobre, aligné gauche)
// Tailwind v3 only — aucun CSS externe
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaComments,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaThumbsUp,
  FaEllipsisH,
  FaSmile,
  FaEdit,
  FaTrash,
  FaHandshake,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const API_URL = "http://127.0.0.1:8000/api";

// 🔧 Mets à true pour tester SANS backend (CRUD commentaires en local)
const COMMENTS_STATIC = false;

const TYPES = {
  BENEVOLAT: "🤝 Bénévolat",
  DON: "🎁 Don",
  EVENEMENT: "📅 Événement",
};

const REACTIONS = [
  { type: "LIKE", label: "👍", name: "J'aime" },
  { type: "JADORE", label: "❤️", name: "J'adore" },
  { type: "SAD", label: "😢", name: "Triste" },
  { type: "ANGRY", label: "😡", name: "En colère" },
];

export default function ListAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comments & reactions
  const [commentaires, setCommentaires] = useState({}); // { [annonceId]: Comment[] }
  const [reactions, setReactions] = useState({}); // { [annonceId]: Reaction[] }

  // UI state
  const [expandedPosts, setExpandedPosts] = useState({}); // { [annonceId]: boolean }
  const [showComments, setShowComments] = useState({});
  const [commentInput, setCommentInput] = useState({}); // { [annonceId]: "text" }
  const [editingComment, setEditingComment] = useState(null); // { id, annonceId, contenu }
  const [commentLimit, setCommentLimit] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState({}); // { [annonceId]: bool }
  const [participations, setParticipations] = useState({}); // UI-only

  // Sticky hover timers pour le picker
  const pickerTimersRef = useRef({}); // { [annonceId]: timeoutId | null }

  // Auth
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id || "";
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // ======= Fetch init =======
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [annoncesRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/annonces/`, { headers }),
          axios.get(`${API_URL}/categories/`, { headers }),
        ]);
        setAnnonces(annoncesRes.data);
        setCategories(categoriesRes.data);

        annoncesRes.data.forEach((a) => {
          fetchCommentaires(a.id);
          fetchReactions(a.id);
        });

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        toast.error("Erreur lors du chargement des données");
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======= Utils =======
  const toggleExpand = (id) =>
    setExpandedPosts((prev) => ({ ...prev, [id]: !prev[id] }));

  const timeAgo = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    const m = Math.floor(s / 60),
      h = Math.floor(m / 60),
      j = Math.floor(h / 24);
    if (s < 60) return "À l’instant";
    if (m < 60) return `${m} min`;
    if (h < 24) return `${h} h`;
    if (j < 7) return `${j} j`;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.nom : "Non catégorisé";
  };

  // ======= Reactions =======
  const fetchReactions = async (annonceId) => {
    try {
      const res = await axios.get(
        `${API_URL}/annonces/${annonceId}/reactions/`,
        { headers }
      );
      setReactions((prev) => ({ ...prev, [annonceId]: res.data || [] }));
    } catch (err) {
      console.error("Erreur chargement réactions", err);
    }
  };

  const getUserReaction = (annonceId) =>
    (reactions[annonceId] || []).find((r) => r.utilisateur?.id === userId);

  const reactionSummary = (annonceId) => {
    const list = reactions[annonceId] || [];
    const counts = {};
    for (const r of list) counts[r.type] = (counts[r.type] || 0) + 1;
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => REACTIONS.find((x) => x.type === type)?.label || "👍");
    const total = list.length;
    return { top, total };
  };

  const openPicker = (id) => {
    const t = pickerTimersRef.current[id];
    if (t) clearTimeout(t);
    pickerTimersRef.current[id] = null;
    setShowReactionPicker((p) => ({ ...p, [id]: true }));
  };

  const scheduleClosePicker = (id) => {
    const prev = pickerTimersRef.current[id];
    if (prev) clearTimeout(prev);
    pickerTimersRef.current[id] = setTimeout(() => {
      setShowReactionPicker((p) => ({ ...p, [id]: false }));
      pickerTimersRef.current[id] = null;
    }, 220);
  };

  const removeReaction = async (annonceId) => {
    const existing = getUserReaction(annonceId);
    if (!existing) return;
    await axios.delete(`${API_URL}/reactions/${existing.id}/`, { headers });
    fetchReactions(annonceId);
  };

  const handleReaction = async (annonceId, type) => {
    try {
      const existing = getUserReaction(annonceId);
      if (existing) {
        if (existing.type === type) {
          await axios.delete(`${API_URL}/reactions/${existing.id}/`, { headers });
        } else {
          await axios.put(
            `${API_URL}/reactions/${existing.id}/`,
            { type },
            { headers }
          );
        }
      } else {
        await axios.post(
          `${API_URL}/annonces/${annonceId}/reactions/`,
          { type },
          { headers }
        );
      }
      fetchReactions(annonceId);
      setShowReactionPicker((p) => ({ ...p, [annonceId]: false }));
    } catch {
      toast.error("Erreur lors de la réaction");
    }
  };

  // ======= Participer (UI toggle) =======
  const handleParticiper = async (annonceId) => {
    const active = !!participations[annonceId];
    try {
      setParticipations((p) => ({ ...p, [annonceId]: !active }));
      toast.success(!active ? "Participation enregistrée" : "Participation annulée");
    } catch {
      toast.error("Impossible d'enregistrer la participation");
    }
  };

  // ======= Comments (CRUD optimiste + API | ou static local) =======
  const fetchCommentaires = async (annonceId) => {
    if (COMMENTS_STATIC) {
      setCommentaires((prev) => ({ ...prev, [annonceId]: prev[annonceId] || [] }));
      setCommentLimit((p) => ({ ...p, [annonceId]: 2 }));
      return;
    }
    try {
      const res = await axios.get(
        `${API_URL}/annonces/${annonceId}/commentaires/`,
        { headers }
      );
      setCommentaires((prev) => ({ ...prev, [annonceId]: res.data || [] }));
      setCommentLimit((p) => ({ ...p, [annonceId]: 2 }));
    } catch (err) {
      console.error("Erreur chargement commentaires", err);
      toast.error("Impossible de charger les commentaires");
    }
  };

  const tmpId = () =>
    `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleCommentSubmit = async (annonceId) => {
    const texte = (commentInput[annonceId] || "").trim();
    if (!texte) return;

    // Optimiste: add local
    const optimistic = {
      id: tmpId(),
      contenu: texte,
      auteur: { id: userId, username: user?.username || "Moi" },
      date_creation: new Date().toISOString(),
      __optimistic: true,
    };
    setCommentaires((prev) => {
      const arr = prev[annonceId] ? [...prev[annonceId]] : [];
      return { ...prev, [annonceId]: [...arr, optimistic] };
    });
    setCommentInput((p) => ({ ...p, [annonceId]: "" }));
    setShowComments((p) => ({ ...p, [annonceId]: true }));

    if (COMMENTS_STATIC) return;

    // API
    try {
      await axios.post(
        `${API_URL}/annonces/${annonceId}/commentaires/`,
        { contenu: texte },
        { headers }
      );
      fetchCommentaires(annonceId);
    } catch (err) {
      // rollback
      setCommentaires((prev) => {
        const arr = (prev[annonceId] || []).filter((c) => c.id !== optimistic.id);
        return { ...prev, [annonceId]: arr };
      });
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingComment) return;
    const { id, annonceId, contenu } = editingComment;

    // Optimiste: update local
    let backup;
    setCommentaires((prev) => {
      const arr = (prev[annonceId] || []).map((c) => {
        if (c.id === id) {
          backup = c;
          return { ...c, contenu };
        }
        return c;
      });
      return { ...prev, [annonceId]: arr };
    });
    setEditingComment(null);

    if (COMMENTS_STATIC) {
      toast.success("Commentaire modifié (test)");
      return;
    }

    // API
    try {
      await axios.put(`${API_URL}/commentaires/${id}/`, { contenu }, { headers });
      fetchCommentaires(annonceId);
      toast.success("Commentaire modifié");
    } catch (err) {
      // rollback
      setCommentaires((prev) => {
        const arr = (prev[annonceId] || []).map((c) => (c.id === id ? backup : c));
        return { ...prev, [annonceId]: arr };
      });
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDeleteComment = async (annonceId, commentId) => {
    // Optimiste: remove local
    const prevArr = commentaires[annonceId] || [];
    const backup = [...prevArr];
    setCommentaires((prev) => ({
      ...prev,
      [annonceId]: prevArr.filter((c) => c.id !== commentId),
    }));

    if (COMMENTS_STATIC) {
      toast.success("Commentaire supprimé (test)");
      return;
    }

    // API
    try {
      await axios.delete(`${API_URL}/commentaires/${commentId}/`, { headers });
      toast.success("Commentaire supprimé");
      fetchCommentaires(annonceId); // resync (optionnel)
    } catch (err) {
      // rollback
      setCommentaires((prev) => ({ ...prev, [annonceId]: backup }));
      toast.error("Erreur lors de la suppression");
    }
  };

  // ======= Render =======
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <ToastContainer position="top-right" autoClose={3000} />
        <ul className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="rounded-xl bg-white shadow-sm border border-slate-100">
              <div className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-56 bg-slate-100 animate-pulse" />
              <div className="p-4">
                <div className="h-3 w-5/6 bg-slate-100 rounded animate-pulse" />
                <div className="mt-2 h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 border border-rose-200 bg-rose-50 text-rose-700 rounded-xl">
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <ul className="space-y-5">
        {annonces.map((annonce) => {
          const userReaction = getUserReaction(annonce.id);
          const selectedEmoji = userReaction
            ? REACTIONS.find((x) => x.type === userReaction.type)?.label ?? "👍"
            : null;

          const { top, total } = reactionSummary(annonce.id);
          const allComments = commentaires[annonce.id] || [];
          const limit = commentLimit[annonce.id] || 2;
          const isExpanded = !!expandedPosts[annonce.id];
          const isParticipating = !!participations[annonce.id];

          return (
            <li
              key={annonce.id}
              className="relative rounded-xl bg-white shadow-sm border border-slate-200/60 overflow-visible"
            >
              {/* Header */}
              <header className="p-3 flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 grid place-items-center overflow-hidden border border-slate-200 shrink-0">
                  {annonce.association?.logo ? (
                    <img
                      src={`http://127.0.0.1:8000/media/${annonce.association.logo}`}
                      alt="logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-slate-900 truncate">
                      {annonce.association?.nom}
                    </h3>
                    <span className="text-xs text-slate-500 shrink-0">
                      • {TYPES[annonce.type] || annonce.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {timeAgo(annonce.date_creation)} • {getCategoryName(annonce.categorie)}
                  </div>
                </div>
                <button
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-600 shrink-0"
                  title="Actions"
                >
                  <FaEllipsisH />
                </button>
              </header>

              {/* Corps (texte + image) */}
              <section className="px-3">
                <PostText
                  titre={annonce.titre}
                  description={annonce.description}
                  expanded={isExpanded}
                  onToggle={() => toggleExpand(annonce.id)}
                />
                {annonce.image && (
                  <div className="mt-2 overflow-hidden rounded-md bg-slate-50 border border-slate-100">
                    <img
                      src={annonce.image}
                      alt="annonce"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </section>

              {/* Meta (lieu / dates) */}
              <div className="px-3 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <FaMapMarkerAlt /> {annonce.lieu || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FaCalendarAlt /> {formatDate(annonce.date_debut)} – {formatDate(annonce.date_fin)}
                </span>
              </div>

              {/* Résumé réactions / commentaires */}
              <div className="px-3 mt-2 flex items-center justify-between text-[13px] text-slate-600">
                <div className="flex items-center gap-1">
                  {top.map((e, idx) => (
                    <span key={idx} className="inline-block text-base leading-none">{e}</span>
                  ))}
                  <span className="ml-1">{total}</span>
                </div>
                <button
                  className="hover:underline"
                  onClick={() =>
                    setShowComments((p) => ({ ...p, [annonce.id]: !p[annonce.id] }))
                  }
                >
                  {(commentaires[annonce.id] || []).length} commentaires
                </button>
              </div>

              {/* Actions (sobre) */}
              <div className="mt-2 border-t border-slate-100">
                <div className="px-1 py-1 grid grid-cols-3">
                  {/* Réagir (picker sticky) */}
                  <div
                    className="relative"
                    onMouseEnter={() => openPicker(annonce.id)}
                    onMouseLeave={() => scheduleClosePicker(annonce.id)}
                  >
                    <button
                      className={`w-full inline-flex items-center justify-center gap-2 text-[14px] py-2 rounded-md transition
                        ${getUserReaction(annonce.id)
                          ? "text-blue-600 font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                        }`}
                      aria-label="Réagir"
                      onClick={() => {
                        if (getUserReaction(annonce.id)) {
                          removeReaction(annonce.id); // 2e clic = retirer
                        } else {
                          handleReaction(annonce.id, "LIKE"); // 1er clic = like rapide
                        }
                      }}
                    >
                      <span className="text-lg leading-none">
                        {selectedEmoji ?? <FaThumbsUp />}
                      </span>
                      <span>Réagir</span>
                    </button>

                    {showReactionPicker[annonce.id] && (
                      <div
                        className="absolute z-50 -top-14 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-full shadow-md flex items-center gap-2"
                        role="menu"
                        onMouseEnter={() => openPicker(annonce.id)} // annule le timer
                        onMouseLeave={() => scheduleClosePicker(annonce.id)} // referme avec délai
                      >
                        {REACTIONS.map((r) => (
                          <button
                            key={r.type}
                            title={r.name}
                            className="text-xl hover:scale-110 transition-transform"
                            onClick={() => handleReaction(annonce.id, r.type)}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Commenter */}
                  <button
                    className="w-full inline-flex items-center justify-center gap-2 text-[14px] py-2 rounded-md text-slate-700 hover:bg-slate-50"
                    onClick={() =>
                      setShowComments((p) => ({ ...p, [annonce.id]: true }))
                    }
                  >
                    <FaComments className="text-base" />
                    <span>Commenter</span>
                  </button>

                  {/* Participer */}
                  <button
                    className={`w-full inline-flex items-center justify-center gap-2 text-[14px] py-2 rounded-md transition
                      ${isParticipating ? "text-emerald-600 font-medium" : "text-slate-700 hover:bg-slate-50"}`}
                    onClick={() => handleParticiper(annonce.id)}
                    title={isParticipating ? "Annuler la participation" : "Participer"}
                  >
                    <FaHandshake className="text-base" />
                    <span>Participer</span>
                  </button>
                </div>
              </div>

              {/* Commentaires */}
              {showComments[annonce.id] && (
                <CommentsBlock
                  annonceId={annonce.id}
                  comments={allComments}
                  limit={limit}
                  setCommentLimit={setCommentLimit}
                  userId={userId}
                  commentInput={commentInput}
                  setCommentInput={setCommentInput}
                  onSubmit={handleCommentSubmit}
                  onDelete={handleDeleteComment}
                  editingComment={editingComment}
                  setEditingComment={setEditingComment}
                  onSaveEdit={handleSaveEdit}
                  timeAgo={timeAgo}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* -------- Composants -------- */

function CommentsBlock({
  annonceId,
  comments,
  limit,
  setCommentLimit,
  userId,
  commentInput,
  setCommentInput,
  onSubmit,
  onDelete,
  editingComment,
  setEditingComment,
  onSaveEdit,
  timeAgo,
}) {
  const [menuOpenId, setMenuOpenId] = useState(null); // id du commentaire dont le menu est ouvert

  // fermer le menu au clic global / touche Échap
  useEffect(() => {
    const onDocClick = () => setMenuOpenId(null);
    const onEsc = (e) => e.key === "Escape" && setMenuOpenId(null);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const startEdit = (c) => {
    setMenuOpenId(null);
    setEditingComment({ id: c.id, annonceId, contenu: c.contenu });
  };

  const visible = comments.slice(-limit);

  return (
    <div className="border-t border-slate-100 px-3 py-2">
      {comments.length > visible.length && (
        <button
          className="text-xs text-slate-600 hover:underline"
          onClick={() =>
            setCommentLimit((p) => ({
              ...p,
              [annonceId]: Math.min(comments.length, (p[annonceId] || 2) + 3),
            }))
          }
        >
          Afficher plus de commentaires
        </button>
      )}

      <div className="mt-2 space-y-2">
        {visible.map((c) => {
          const isMine = c.auteur?.id === userId;
          const isEditing =
            editingComment?.id === c.id &&
            editingComment?.annonceId === annonceId;

          return (
            <div key={c.id} className="flex items-start gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-100 grid place-items-center text-slate-500 shrink-0">
                <FaUser />
              </div>

              <div className="flex-1 min-w-0">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-900 truncate">
                          {c.auteur?.username || "Utilisateur"}
                        </span>
                        <span className="text-[12px] text-slate-500 shrink-0">
                          {timeAgo(c.date_creation || c.date)}
                        </span>
                      </div>
                    </div>

                    {isMine && (
                      <div
                        className="relative shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                          onClick={() =>
                            setMenuOpenId((curr) => (curr === c.id ? null : c.id))
                          }
                          aria-label="Actions"
                          title="Actions"
                        >
                          <FaEllipsisH />
                        </button>

                        {menuOpenId === c.id && (
                          <div
                            className="absolute right-0 z-40 mt-1 w-36 bg-white border border-slate-200 rounded-md shadow-md py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="w-full px-3 py-1.5 text-left text-[13px] hover:bg-slate-50 flex items-center gap-2"
                              onClick={() => startEdit(c)}
                            >
                              <FaEdit className="text-slate-600" />
                              Modifier
                            </button>
                            <button
                              className="w-full px-3 py-1.5 text-left text-[13px] hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                              onClick={() => {
                                setMenuOpenId(null);
                                onDelete(annonceId, c.id);
                              }}
                            >
                              <FaTrash />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-1">
                      <textarea
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px]"
                        rows={2}
                        value={editingComment.contenu}
                        onChange={(e) =>
                          setEditingComment((prev) => ({
                            ...prev,
                            contenu: e.target.value,
                          }))
                        }
                      />
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          onClick={onSaveEdit}
                          className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[13px]"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingComment(null)}
                          className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-[13px]"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[14px] text-slate-800 whitespace-pre-line break-words">
                      {c.contenu}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nouveau commentaire */}
      <div className="mt-2 flex items-start gap-2">
        <div className="h-8 w-8 rounded-full bg-slate-100 grid place-items-center text-slate-500 shrink-0">
          <FaUser />
        </div>
        <div className="flex-1">
          <div className="relative">
            <textarea
              rows={1}
              className="w-full resize-none px-3 py-2 pr-10 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px]"
              placeholder="Écrire un commentaire..."
              value={commentInput[annonceId] || ""}
              onChange={(e) =>
                setCommentInput((p) => ({
                  ...p,
                  [annonceId]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(annonceId);
                }
              }}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-slate-100 text-slate-600"
              title="Emoji"
              onClick={() => toast.info("Sélecteur d'emoji à implémenter")}
            >
              <FaSmile />
            </button>
          </div>
          <div className="mt-1 flex justify-end">
            <button
              onClick={() => onSubmit(annonceId)}
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[13px]"
            >
              Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Texte du post (sobre, FB-like) :
 *  - Titre sobre, aligné à gauche
 *  - Description cachée tant que "Plus d'infos" n'est pas cliqué
 */
function PostText({ titre, description, expanded, onToggle }) {
  return (
    <div className="pb-1">
      {titre ? (
        <h2 className="text-[16px] sm:text-[17px] font-semibold text-slate-900">
          {titre}
        </h2>
      ) : null}

      {description ? (
        expanded ? (
          <>
            <p className="mt-2 text-[15px] leading-6 text-slate-800">
              {description}
            </p>
            <button
              onClick={onToggle}
              className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-slate-900"
            >
              Voir moins <FaChevronUp className="text-xs" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-700"
          >
            Plus d’infos <FaChevronDown className="text-xs" />
          </button>
        )
      ) : null}
    </div>
  );
}
