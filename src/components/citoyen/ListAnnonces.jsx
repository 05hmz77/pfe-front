// ListAnnonces.jsx — Version complète (≈800 lignes) avec:
// - Filtres For You / Toutes
// - Réactions (LIKE/LOVE/HAHA/WOW/SAD/ANGRY) avec picker sticky
// - Commentaires CRUD (optimiste + sync API)
// - Participation via modal Tailwind (POST /candidatures/)
// - Affichages lieu/date/catégorie + image + header association
// - États de chargement / erreurs / toasts
// - Composants décomposés: PostHeader, PostText, PostMeta, PostActions, CommentsBlock, ParticipationModal
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  FaStar,
  FaGlobe,
  FaHeart,
  FaLaughSquint,
  FaSurprise,
  FaSadTear,
  FaAngry,
} from "react-icons/fa";

// ========================= Constantes & Helpers =========================
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const COMMENTS_STATIC = false; // passer à true pour tester sans backend

const TYPES = {
  BENEVOLAT: "🤝 Bénévolat",
  DON: "🎁 Don",
  EVENEMENT: "📅 Événement",
};

const REACTIONS = [
  { type: "LIKE", label: "👍", name: "J'aime", icon: FaThumbsUp, color: "text-blue-500" },
  { type: "LOVE", label: "❤️", name: "J'adore", icon: FaHeart, color: "text-rose-500" },
  { type: "HAHA", label: "😂", name: "Haha", icon: FaLaughSquint, color: "text-yellow-500" },
  { type: "WOW", label: "😲", name: "Wow", icon: FaSurprise, color: "text-amber-500" },
  { type: "SAD", label: "😢", name: "Triste", icon: FaSadTear, color: "text-indigo-500" },
  { type: "ANGRY", label: "😠", name: "En colère", icon: FaAngry, color: "text-red-600" },
];

const cls = (...arr) => arr.filter(Boolean).join(" ");

// Temps relatif en FR
const timeAgo = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  const m = Math.floor(s / 60), h = Math.floor(m / 60), j = Math.floor(h / 24);
  if (s < 60) return "À l'instant";
  if (m < 60) return `${m} min`;
  if (h < 24) return `${h} h`;
  if (j < 7) return `${j} j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

const formatDate = (dateString) =>
  dateString
    ? new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const tmpId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ========================= Composant principal =========================
export default function ListAnnonces() {
  // --------- Auth & Headers ---------
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id || null;
  const isAssoc = user?.role === "ASSOCIATION"; // pour gérer la participation côté UI si besoin
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // --------- States ---------
  const [annonces, setAnnonces] = useState([]);
  const [filteredAnnonces, setFilteredAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("forYou"); // forYou | all

  // Réactions & Commentaires
  const [reactions, setReactions] = useState({}); // { [annonceId]: Reaction[] }
  const [commentaires, setCommentaires] = useState({}); // { [annonceId]: Comment[] }
  const [commentInput, setCommentInput] = useState({}); // { [annonceId]: string }
  const [commentLimit, setCommentLimit] = useState({}); // { [annonceId]: number }
  const [editingComment, setEditingComment] = useState(null); // { id, annonceId, contenu }

  // UI
  const [expandedPosts, setExpandedPosts] = useState({}); // { [annonceId]: bool }
  const [showComments, setShowComments] = useState({}); // { [annonceId]: bool }
  const [showReactionPicker, setShowReactionPicker] = useState({}); // { [annonceId]: bool }
  const pickerTimersRef = useRef({}); // { [annonceId]: timeoutId }

  // Participation
  const [participations, setParticipations] = useState({}); // { [annonceId]: bool }
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAnnonceId, setModalAnnonceId] = useState(null);
  const [participationMessage, setParticipationMessage] = useState("");
  const [submittingParticipation, setSubmittingParticipation] = useState(false);

  // --------- Init fetch ---------
  useEffect(() => {
    const run = async () => {
      try {
        const [aRes, cRes] = await Promise.all([
          axios.get(`${API_URL}/annonces/`, { headers }),
          axios.get(`${API_URL}/categories/`, { headers }),
        ]);
        setAnnonces(aRes.data);
        setFilteredAnnonces(aRes.data);
        setCategories(cRes.data);

        // précharger réactions/commentaires
        aRes.data.forEach((a) => {
          fetchReactions(a.id);
          fetchCommentaires(a.id);
        });
        setLoading(false);
      } catch (e) {
        setError(e?.message || "Erreur de chargement");
        setLoading(false);
        toast.error("Erreur lors du chargement des données");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------- Filtre ForYou / All ---------
  useEffect(() => {
    if (filter === "forYou") setFilteredAnnonces(annonces.slice(0, 3));
    else setFilteredAnnonces(annonces);
  }, [filter, annonces]);

  // ========================= Reactions =========================
  const fetchReactions = async (annonceId) => {
    try {
      const res = await axios.get(`${API_URL}/annonces/${annonceId}/reactions/`, { headers });
      setReactions((prev) => ({ ...prev, [annonceId]: res.data || [] }));
    } catch (e) {
      console.warn("Erreur reactions", e?.response?.data || e?.message);
    }
  };

  const getUserReaction = (annonceId) => (reactions[annonceId] || []).find((r) => r.utilisateur?.id === userId);

  const reactionSummary = (annonceId) => {
    const list = reactions[annonceId] || [];
    const counts = {};
    for (const r of list) counts[r.type] = (counts[r.type] || 0) + 1;
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => REACTIONS.find((x) => x.type === type)?.label || "👍");
    return { top, total: list.length };
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
    try {
      await axios.delete(`${API_URL}/reactions/${existing.id}/`, { headers });
      fetchReactions(annonceId);
    } catch (e) {
      toast.error("Erreur lors de la suppression de la réaction");
    }
  };

  const handleReaction = async (annonceId, type) => {
    try {
      const existing = getUserReaction(annonceId);
      if (existing) {
        if (existing.type === type) {
          await axios.delete(`${API_URL}/reactions/${existing.id}/`, { headers });
        } else {
          await axios.put(`${API_URL}/reactions/${existing.id}/`, { type }, { headers });
        }
      } else {
        await axios.post(`${API_URL}/annonces/${annonceId}/reactions/`, { type }, { headers });
      }
      fetchReactions(annonceId);
      setShowReactionPicker((p) => ({ ...p, [annonceId]: false }));
    } catch (e) {
      toast.error("Erreur lors de la réaction");
    }
  };

  // ========================= Commentaires =========================
  const fetchCommentaires = async (annonceId) => {
    if (COMMENTS_STATIC) {
      setCommentaires((prev) => ({ ...prev, [annonceId]: prev[annonceId] || [] }));
      setCommentLimit((p) => ({ ...p, [annonceId]: 2 }));
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/annonces/${annonceId}/commentaires/`, { headers });
      setCommentaires((prev) => ({ ...prev, [annonceId]: res.data || [] }));
      setCommentLimit((p) => ({ ...p, [annonceId]: 2 }));
    } catch (e) {
      console.warn("Erreur commentaires", e?.response?.data || e?.message);
      toast.error("Impossible de charger les commentaires");
    }
  };

  const submitComment = async (annonceId) => {
    const texte = (commentInput[annonceId] || "").trim();
    if (!texte) return;

    // Optimiste
    const optimistic = {
      id: tmpId(),
      contenu: texte,
      auteur: { id: userId, username: user?.username || "Moi" },
      date_creation: new Date().toISOString(),
      __optimistic: true,
    };
    setCommentaires((prev) => ({ ...prev, [annonceId]: [...(prev[annonceId] || []), optimistic] }));
    setCommentInput((p) => ({ ...p, [annonceId]: "" }));
    setShowComments((p) => ({ ...p, [annonceId]: true }));

    if (COMMENTS_STATIC) return;

    try {
      await axios.post(`${API_URL}/annonces/${annonceId}/commentaires/`, { contenu: texte }, { headers });
      fetchCommentaires(annonceId);
    } catch (e) {
      // rollback
      setCommentaires((prev) => ({
        ...prev,
        [annonceId]: (prev[annonceId] || []).filter((c) => c.id !== optimistic.id),
      }));
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  const saveEditComment = async () => {
    if (!editingComment) return;
    const { id, annonceId, contenu } = editingComment;

    // Optimiste
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

    try {
      await axios.put(`${API_URL}/commentaires/${id}/`, { contenu }, { headers });
      fetchCommentaires(annonceId);
      toast.success("Commentaire modifié");
    } catch (e) {
      // rollback
      setCommentaires((prev) => {
        const arr = (prev[annonceId] || []).map((c) => (c.id === id ? backup : c));
        return { ...prev, [annonceId]: arr };
      });
      toast.error("Erreur lors de la modification");
    }
  };

  const deleteComment = async (annonceId, commentId) => {
    const prevArr = commentaires[annonceId] || [];
    const backup = [...prevArr];
    setCommentaires((prev) => ({ ...prev, [annonceId]: prevArr.filter((c) => c.id !== commentId) }));

    if (COMMENTS_STATIC) {
      toast.success("Commentaire supprimé (test)");
      return;
    }

    try {
      await axios.delete(`${API_URL}/commentaires/${commentId}/`, { headers });
      toast.success("Commentaire supprimé");
      fetchCommentaires(annonceId);
    } catch (e) {
      setCommentaires((prev) => ({ ...prev, [annonceId]: backup }));
      toast.error("Erreur lors de la suppression");
    }
  };

  // ========================= Participation =========================
  const openParticipation = (annonceId) => {
    setModalAnnonceId(annonceId);
    setParticipationMessage("");
    setModalOpen(true);
  };

  const submitParticipation = async () => {
    if (!userId) {
      toast.error("Vous devez être connecté(e) pour participer.");
      return;
    }
    if (!participationMessage.trim()) {
      toast.error("Merci d'écrire un message");
      return;
    }
    try {
      setSubmittingParticipation(true);
      await axios.post(
        `${API_URL}/candidatures/`,
        { message: participationMessage.trim(), annonce: modalAnnonceId, citoyen: userId },
        { headers }
      );
      setParticipations((prev) => ({ ...prev, [modalAnnonceId]: true }));
      toast.success("Participation enregistrée !");
      setModalOpen(false);
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message;
      console.error("Erreur participation", msg);
      toast.error("Impossible d'enregistrer la participation");
    } finally {
      setSubmittingParticipation(false);
    }
  };

  // ========================= Render =========================
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

      {/* Filtres */}
      <div className="flex mb-4 bg-white rounded-xl p-2 shadow-sm border border-slate-200/60">
        <button
          className={cls(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors",
            filter === "forYou" ? "bg-blue-400 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
          )}
          onClick={() => setFilter("forYou")}
        >
          <FaStar className="text-sm" />
          <span>For You</span>
        </button>

        <button
          className={cls(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors",
            filter === "all" ? "bg-blue-400 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
          )}
          onClick={() => setFilter("all")}
        >
          <FaGlobe className="text-sm" />
          <span>Toutes les annonces</span>
        </button>
      </div>

      {/* Liste des annonces */}
      <ul className="space-y-5">
        {filteredAnnonces.map((annonce) => {
          const isExpanded = !!expandedPosts[annonce.id];
          const isParticipating = !!participations[annonce.id];
          const { top, total } = reactionSummary(annonce.id);
          const userReaction = getUserReaction(annonce.id);
          const selectedReaction = userReaction ? REACTIONS.find((x) => x.type === userReaction.type) : null;
          const allComments = commentaires[annonce.id] || [];
          const limit = commentLimit[annonce.id] || 2;

          return (
            <li key={annonce.id} className="relative rounded-xl bg-white shadow-sm border border-slate-200/60 overflow-visible transition-all hover:shadow-md">
              {/* Badge For You */}
              {filter === "forYou" && (
                <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold py-1 px-2 rounded-full shadow-md flex items-center gap-1">
                  <FaStar className="text-[10px]" />
                  <span>For You</span>
                </div>
              )}

              {/* Header association */}
              <PostHeader annonce={annonce} types={TYPES} timeAgo={timeAgo} categories={categories} />

              {/* Corps (texte + image) */}
              <section className="px-4">
                <PostText titre={annonce.titre} description={annonce.description} expanded={isExpanded} onToggle={() => setExpandedPosts((p) => ({ ...p, [annonce.id]: !p[annonce.id] }))} />
                {annonce.image && (
                  <div className="mt-3 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                    <img src={annonce.image} alt="annonce" className="w-full h-auto object-cover" />
                  </div>
                )}
              </section>

              {/* Meta */}
              <PostMeta annonce={annonce} />

              {/* Résumé réactions / commentaires */}
              <div className="px-4 mt-3 flex items-center justify-between text-[13px] text-slate-600">
                <div className="flex items-center gap-1">
                  {top.map((e, idx) => (
                    <span key={idx} className="inline-block text-base leading-none">{e}</span>
                  ))}
                  {total > 0 && <span className="ml-1">{total}</span>}
                </div>
                <button className="hover:underline transition-colors" onClick={() => setShowComments((p) => ({ ...p, [annonce.id]: !p[annonce.id] }))}>
                  {(commentaires[annonce.id] || []).length} commentaires
                </button>
              </div>

              {/* Actions */}
              <div className="mt-3 border-t border-slate-100">
                <div className="px-1 py-1 grid grid-cols-3">
                  {/* Réagir */}
                  <div className="relative" onMouseEnter={() => openPicker(annonce.id)} onMouseLeave={() => scheduleClosePicker(annonce.id)}>
                    <button
                      className={cls(
                        "w-full inline-flex items-center justify-center gap-2 text-[14px] py-2 rounded-md transition",
                        userReaction ? `${selectedReaction?.color || "text-blue-600"} font-medium` : "text-slate-700 hover:bg-slate-50"
                      )}
                      aria-label="Réagir"
                      onClick={() => {
                        if (userReaction) removeReaction(annonce.id);
                        else handleReaction(annonce.id, "LIKE");
                      }}
                    >
                      <span className="text-lg leading-none">{selectedReaction ? selectedReaction.label : <FaThumbsUp />}</span>
                      <span>Réagir</span>
                    </button>

                    {showReactionPicker[annonce.id] && (
                      <div
                        className="absolute z-50 -top-16 left-1/2 -translate-x-1/2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center gap-3"
                        role="menu"
                        onMouseEnter={() => openPicker(annonce.id)}
                        onMouseLeave={() => scheduleClosePicker(annonce.id)}
                      >
                        {REACTIONS.map((r) => (
                          <button key={r.type} title={r.name} className="text-2xl hover:scale-125 transition-transform duration-200" onClick={() => handleReaction(annonce.id, r.type)}>
                            {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Commenter */}
                  <button className="w-full inline-flex items-center justify-center gap-2 text-[14px] py-2 rounded-md text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setShowComments((p) => ({ ...p, [annonce.id]: true }))}>
                    <FaComments className="text-base" />
                    <span>Commenter</span>
                  </button>

                  {/* Participer */}
                  <button
                    className={cls(
                      "w-full inline-flex items-center justify-center gap-2 text-[14px] py-2 rounded-md transition",
                      isParticipating ? "text-emerald-600 font-medium" : "text-slate-700 hover:bg-slate-50"
                    )}
                    onClick={() => openParticipation(annonce.id)}
                    title={isParticipating ? "Déjà participant" : "Participer"}
                    disabled={isAssoc} // option: empêcher les associations de participer
                  >
                    <FaHandshake className="text-base" />
                    <span>{isParticipating ? "Déjà participant" : "Participer"}</span>
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
                  onSubmit={submitComment}
                  onDelete={deleteComment}
                  editingComment={editingComment}
                  setEditingComment={setEditingComment}
                  onSaveEdit={saveEditComment}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* Modal Participation */}
      {modalOpen && (
        <ParticipationModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          message={participationMessage}
          setMessage={setParticipationMessage}
          onSubmit={submitParticipation}
          submitting={submittingParticipation}
        />
      )}
    </div>
  );
}

// ========================= Sous-composants =========================
function PostHeader({ annonce, types, timeAgo, categories }) {
  return (
    <header className="p-4 flex items-start gap-3">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-slate-500 grid place-items-center overflow-hidden border border-slate-200 shrink-0">
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
          <h3 className="text-[15px] font-semibold text-slate-900 truncate">{annonce.association?.nom}</h3>
          <span className="text-xs text-slate-500 shrink-0">• {types[annonce.type] || annonce.type}</span>
        </div>
        <div className="text-xs text-slate-500">
          {timeAgo(annonce.date_creation)} • {getCategoryNameLocal(categories, annonce.categorie)}
        </div>
      </div>
      <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 shrink-0 transition-colors" title="Actions">
        <FaEllipsisH />
      </button>
    </header>
  );
}

function getCategoryNameLocal(categories, id) {
  const c = categories.find((x) => x.id === id);
  return c ? c.nom : "Non catégorisé";
}

function PostText({ titre, description, expanded, onToggle }) {
  return (
    <div className="pb-1">
      {titre ? (
        <h2 className="text-[16px] sm:text-[17px] font-semibold text-slate-900">{titre}</h2>
      ) : null}

      {description ? (
        expanded ? (
          <>
            <p className="mt-2 text-[15px] leading-6 text-slate-800 whitespace-pre-line">{description}</p>
            <button onClick={onToggle} className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Voir moins <FaChevronUp className="text-xs" />
            </button>
          </>
        ) : (
          <button onClick={onToggle} className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Plus d'infos <FaChevronDown className="text-xs" />
          </button>
        )
      ) : null}
    </div>
  );
}

function PostMeta({ annonce }) {
  return (
    <div className="px-4 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600">
      <span className="inline-flex items-center gap-1.5">
        <FaMapMarkerAlt /> {annonce.lieu || "—"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <FaCalendarAlt /> {formatDate(annonce.date_debut)} – {formatDate(annonce.date_fin)}
      </span>
    </div>
  );
}

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
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);

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
    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 rounded-b-xl">
      {comments.length > visible.length && (
        <button
          className="text-xs text-slate-600 hover:text-blue-600 transition-colors mb-2"
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

      <div className="mt-2 space-y-3">
        {visible.map((c) => {
          const isMine = c.auteur?.id === userId;
          const isEditing = editingComment?.id === c.id && editingComment?.annonceId === annonceId;
          return (
            <div key={c.id} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 grid place-items-center text-slate-500 shrink-0">
                <FaUser className="text-sm" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-900 truncate">{c.auteur?.username || "Utilisateur"}</span>
                        <span className="text-[12px] text-slate-500 shrink-0">{timeAgo(c.date_creation || c.date)}</span>
                      </div>
                    </div>

                    {isMine && (
                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                          onClick={() => setMenuOpenId((curr) => (curr === c.id ? null : c.id))}
                          aria-label="Actions"
                          title="Actions"
                        >
                          <FaEllipsisH />
                        </button>

                        {menuOpenId === c.id && (
                          <div className="absolute right-0 z-40 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-full px-3 py-1.5 text-left text-[13px] hover:bg-slate-50 flex items-center gap-2 transition-colors" onClick={() => startEdit(c)}>
                              <FaEdit className="text-slate-600" />
                              Modifier
                            </button>
                            <button className="w-full px-3 py-1.5 text-left text-[13px] hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors" onClick={() => { setMenuOpenId(null); onDelete(annonceId, c.id); }}>
                              <FaTrash />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-2">
                      <textarea
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] transition-all"
                        rows={2}
                        value={editingComment.contenu}
                        onChange={(e) => setEditingComment((prev) => ({ ...prev, contenu: e.target.value }))}
                        autoFocus
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={onSaveEdit} className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[13px] transition-colors">Enregistrer</button>
                        <button onClick={() => setEditingComment(null)} className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-[13px] transition-colors">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[14px] text-slate-800 whitespace-pre-line break-words">{c.contenu}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nouveau commentaire */}
      <div className="mt-3 flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 grid place-items-center text-slate-500 shrink-0">
          <FaUser className="text-sm" />
        </div>
        <div className="flex-1">
          <div className="relative">
            <textarea
              rows={1}
              className="w-full resize-none px-3 py-2 pr-10 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] transition-all"
              placeholder="Écrire un commentaire..."
              value={commentInput[annonceId] || ""}
              onChange={(e) => setCommentInput((p) => ({ ...p, [annonceId]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(annonceId);
                }
              }}
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors" title="Emoji" onClick={() => toast.info("Sélecteur d'emoji à implémenter")}> 
              <FaSmile />
            </button>
          </div>
          <div className="mt-2 flex justify-end">
            <button onClick={() => onSubmit(annonceId)} disabled={!commentInput[annonceId]?.trim()} className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-[13px] transition-colors">
              Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipationModal({ open, onClose, message, setMessage, onSubmit, submitting }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">Confirmer votre participation</h3>
        <textarea
          className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Écris un message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md border hover:bg-slate-50">Annuler</button>
          <button onClick={onSubmit} disabled={submitting} className={cls("px-4 py-2 rounded-md text-white", submitting ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700")}> 
            {submitting ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
