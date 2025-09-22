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
  FaStar,
  FaGlobe,
} from "react-icons/fa";

const API_URL = "http://127.0.0.1:8000/api";

// 🔧 Mets à true pour tester SANS backend (CRUD commentaires en local)
const COMMENTS_STATIC = false;

const TYPES = {
  BENEVOLAT: "🤝 Bénévolat",
  DON: "🎁 Don",
  EVENEMENT: "📅 Événement",
};

// Réactions modernisées avec plus d'options
const REACTIONS = [
  { type: "LIKE", label: "👍", name: "J'aime", icon: FaThumbsUp, color: "text-blue-500" },
  { type: "LOVE", label: "❤️", name: "J'adore", icon: FaHeart, color: "text-rose-500" },
  { type: "HAHA", label: "😂", name: "Haha", icon: FaLaughSquint, color: "text-yellow-500" },
  { type: "WOW", label: "😲", name: "Wow", icon: FaSurprise, color: "text-amber-500" },
  { type: "SAD", label: "😢", name: "Triste", icon: FaSadTear, color: "text-indigo-500" },
  { type: "ANGRY", label: "😠", name: "En colère", icon: FaAngry, color: "text-red-600" },
];

export default function ListAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [filteredAnnonces, setFilteredAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("forYou"); // "forYou" ou "all"

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
        setFilteredAnnonces(annoncesRes.data); // Par défaut, afficher toutes les annonces
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

  // Filtrer les annonces selon le filtre sélectionné
  useEffect(() => {
    if (filter === "forYou") {
      // Pour l'instant, on simule des annonces "For You" en prenant les 3 premières
      // Dans une vraie implémentation, on aurait un appel API spécifique
      setFilteredAnnonces(annonces.slice(0, 3));
    } else {
      setFilteredAnnonces(annonces);
    }
  }, [filter, annonces]);

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
    toast.error("Impossible d'enregistrer la participation avec un compte association");
  };
  const handleSubmitCandidature = async (annonceId) => {
    try {
      const formData = {
        annonce: annonceId,
        statut: "EN_ATTENTE",
        message: "Je souhaite participer à cette annonce",
        date_candidature: new Date().toISOString(),
      };

      const response = await axios.post(
        `${API_URL}/candidatures/`,
        formData,
        { headers }
      );

      if (response.status === 201) {
        toast.success("Votre candidature a bien été envoyée !");
        setParticipations((prev) => ({ ...prev, [annonceId]: true }));
      }
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Vous avez déjà participé à cette annonce.");
      } else {
        toast.error("Erreur lors de l'envoi de la candidature");
      }
      console.error(err);
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

  // ListAnnonces.jsx — avec section "For You" horizontale
// Tailwind v3 only — aucun CSS externe
import React, { useState, useEffect, useRef } from "react";
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

// 🔧 Mets à true pour tester SANS backend
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
  const [commentaires, setCommentaires] = useState({});
  const [reactions, setReactions] = useState({});

  // UI state
  const [expandedPosts, setExpandedPosts] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [commentLimit, setCommentLimit] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState({});
  const [participations, setParticipations] = useState({});
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);

  const pickerTimersRef = useRef({});

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

  // ======= Candidature =======
  const handleSubmitCandidature = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      const formData = {
        annonce: selectedAnnonce.id,
        statut: "EN_ATTENTE",
        message: message || "Je souhaite participer à cette annonce",
        date_candidature: new Date().toISOString(),
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

  // ======= Comments =======
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

    try {
      await axios.post(
        `${API_URL}/annonces/${annonceId}/commentaires/`,
        { contenu: texte },
        { headers }
      );
      fetchCommentaires(annonceId);
    } catch (err) {
      setCommentaires((prev) => {
        const arr = (prev[annonceId] || []).filter((c) => c.id !== optimistic.id);
        return { ...prev, [annonceId]: arr };
      });
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  // ======= Render =======
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <ToastContainer position="top-right" autoClose={3000} />
        <p>Chargement des annonces...</p>
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
      {/* Section toutes les annonces */}
      <h2 className="text-xl font-bold mb-4">Toutes les annonces</h2>
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

              {/* Corps */}
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

              {/* Footer Actions */}
              <div className="mt-2 border-t border-slate-100">
                <div className="px-1 py-1 grid grid-cols-3">
                  {/* Réagir */}
                  <button
                    className="w-full flex items-center justify-center gap-2 text-[14px] py-2 text-slate-700 hover:bg-slate-50"
                    onClick={() => handleReaction(annonce.id, "LIKE")}
                  >
                    <FaThumbsUp />
                    Réagir
                  </button>
                  {/* Commenter */}
                  <button
                    className="w-full flex items-center justify-center gap-2 text-[14px] py-2 text-slate-700 hover:bg-slate-50"
                  >
                    <FaComments /> Commenter
                  </button>
                  {/* Postuler */}
                  <button
                    className="w-full flex items-center justify-center gap-2 text-[14px] py-2 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => {
                      setSelectedAnnonce(annonce);
                      setShowModal(true);
                    }}
                  >
                    <FaHandshake /> Postuler
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Section For You */}
      <div className="max-w-5xl mx-auto mt-10 p-3 sm:p-4">
        <h2 className="text-xl font-bold mb-4">Annonces pour vous</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300">
          {annonces.map((annonce) => (
            <div
              key={`foryou-${annonce.id}`}
              className="min-w-[260px] max-w-[260px] bg-white rounded-xl shadow border border-slate-200 flex-shrink-0"
            >
              {annonce.image && (
                <img
                  src={annonce.image}
                  alt={annonce.titre}
                  className="w-full h-36 object-cover rounded-t-xl"
                />
              )}
              <div className="p-3">
                <h3 className="text-sm font-semibold truncate">
                  {annonce.titre}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {annonce.lieu || "Lieu non précisé"}
                </p>
                <button
                  onClick={() => {
                    setSelectedAnnonce(annonce);
                    setShowModal(true);
                  }}
                  className="mt-2 w-full text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Postuler
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------- Post Text --------- */
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

}