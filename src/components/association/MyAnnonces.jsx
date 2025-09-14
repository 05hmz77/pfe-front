import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LayoutList,
  Search,
  Filter,
  Users,
  MessageCircle,
  Heart,
  Trash2,
  Edit,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Image as ImageIcon,
} from "lucide-react";


const API_ANNONCES = "http://127.0.0.1:8000/api/annonces/";
const API_CANDIDATURES_MES = "http://127.0.0.1:8000/api/candidatures/mes/";
const API_CATEGORIES = "http://127.0.0.1:8000/api/categories/";

export default function MyAnnonces() {
  const token = localStorage.getItem("accessToken");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [annonces, setAnnonces] = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("TOUT");
  const [expanded, setExpanded] = useState({}); // { [annonceId]: boolean }
  const [sortBy, setSortBy] = useState("recent"); // recent | upcoming | mostCands

  // Edition (DYNAMIQUE)
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(null); // l’annonce en édition
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);

  // Création (DYNAMIQUE)
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    titre: "",
    description: "",
    lieu: "",
    type: "EVENEMENT",
    categorie: "",
    date_debut: "",
    date_fin: "",
    imageFile: null,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchAll = async () => {
    if (!currentUser) {
      setError("Utilisateur non connecté.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [annRes, candRes, catRes] = await Promise.all([
        axios.get(API_ANNONCES, { headers }),
        axios.get(API_CANDIDATURES_MES, { headers }),
        axios.get(API_CATEGORIES, { headers }),
      ]);
      const onlyMine = (annRes?.data || []).filter(
        (i) => i?.association?.id === currentUser?.id
      );
      setAnnonces(onlyMine);
      setCandidatures(candRes?.data || []);
      setCategories(catRes?.data || []);
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.detail ||
          "Échec du chargement des données. Vérifiez l'API et le token."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Index candidatures par annonceId pour accès rapide
  const candsByAnnonce = useMemo(() => {
    const map = {};
    if (!annonces?.length || !candidatures?.length) return map;
    const myIds = new Set(annonces.map((a) => a.id));
    for (const c of candidatures) {
      if (myIds.has(c.annonce)) {
        if (!map[c.annonce]) map[c.annonce] = [];
        map[c.annonce].push(c);
      }
    }
    return map;
  }, [annonces, candidatures]);

  // Stats globales
  const stats = useMemo(() => {
    const myIds = new Set(annonces.map((a) => a.id));
    const myCands = candidatures.filter((c) => myIds.has(c.annonce));
    const total = annonces.length;
    const totalCands = myCands.length;
    const acceptees = myCands.filter((c) => c.statut === "ACCEPTEE").length;
    const refusees = myCands.filter((c) => c.statut === "REFUSEE").length;
    const enAttente = myCands.filter((c) => c.statut === "EN_ATTENTE").length;
    return { total, totalCands, acceptees, refusees, enAttente };
  }, [annonces, candidatures]);

  // Filtrage + tri
  const filteredAnnonces = useMemo(() => {
    let list = [...annonces];
    if (typeFilter !== "TOUT") list = list.filter((a) => a.type === typeFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.titre?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.lieu?.toLowerCase().includes(q)
      );
    }
    // Tri
    if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
    } else if (sortBy === "upcoming") {
      list.sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut));
    } else if (sortBy === "mostCands") {
      const counts = Object.fromEntries(
        list.map((a) => [a.id, (candsByAnnonce[a.id] || []).length])
      );
      list.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    }
    return list;
  }, [annonces, typeFilter, searchTerm, sortBy, candsByAnnonce]);

  /* =========================
   *  CRUD DYNAMIQUE
   * ========================= */

  // DELETE /api/annonces/{id}/
  const onDeleteAnnonce = async (annonceId) => {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    try {
      await axios.delete(`${API_ANNONCES}${annonceId}/`, { headers });
      setAnnonces((prev) => prev.filter((a) => a.id !== annonceId));
    } catch (e) {
      console.error(e);
      alert("Suppression impossible. Vérifiez vos droits et réessayez.");
    }
  };

  // Ouvrir la modale d’édition avec les données existantes
  const openEdit = (annonce) => {
    setDraft({
      ...annonce,
      // normaliser les dates dans l'input
      date_debut: normalizeLocal(annonce.date_debut),
      date_fin: normalizeLocal(annonce.date_fin),
      categorie: annonce.categorie?.id || annonce.categorie || "",
    });
    setEditImageFile(null);
    setEditError("");
    setEditOpen(true);
  };

  // PATCH /api/annonces/{id}/ (multipart)
  const saveEditAnnonce = async (e) => {
    e?.preventDefault?.();
    if (!draft?.id) return;

    // validations simples
    if (!draft.titre?.trim()) return setEditError("Le titre est requis.");
    if (!draft.type) return setEditError("Le type est requis.");
    if (!draft.categorie) return setEditError("La catégorie est requise.");
    if (!draft.date_debut || !draft.date_fin)
      return setEditError("Les dates de début et fin sont requises.");

    const fd = new FormData();
    // on envoie un PATCH : uniquement les champs présents seront mis à jour
    fd.append("titre", draft.titre || "");
    fd.append("description", draft.description || "");
    fd.append("lieu", draft.lieu || "");
    fd.append("type", draft.type);
    fd.append("categorie", String(draft.categorie));
    fd.append("date_debut", draft.date_debut);
    fd.append("date_fin", draft.date_fin);
    // image optionnelle
    if (editImageFile) fd.append("image", editImageFile);

    setEditLoading(true);
    try {
      const res = await axios.put(`${API_ANNONCES}${draft.id}/`, fd, { headers });
      const updated = res?.data || null;

      setAnnonces((prev) =>
        prev.map((a) =>
          a.id === draft.id
            ? // si l’API renvoie l’objet à jour, on l’utilise, sinon on merge localement
              updated && updated.id
              ? updated
              : {
                  ...a,
                  ...draft,
                  // si on a uploadé une nouvelle image mais pas d’URL renvoyée, on garde l’ancienne
                  image: updated?.image ?? a.image,
                  // re-normaliser les dates (affichage cartes)
                  date_debut: draft.date_debut,
                  date_fin: draft.date_fin,
                }
            : a
        )
      );
      setEditOpen(false);
    } catch (err) {
      console.error(err);
      setEditError(
        err?.response?.data?.detail ||
          "Échec de la mise à jour. Vérifiez les champs et réessayez."
      );
    } finally {
      setEditLoading(false);
    }
  };

  /* =========================
   *  Création (déjà branchée)
   * ========================= */

  const openCreate = () => {
    setCreateForm({
      titre: "",
      description: "",
      lieu: "",
      type: "EVENEMENT",
      categorie: categories?.[0]?.id || "",
      date_debut: "",
      date_fin: "",
      imageFile: null,
    });
    setCreateError("");
    setCreateOpen(true);
  };

  const handleCreateChange = (key, value) => {
    setCreateForm((p) => ({ ...p, [key]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e?.preventDefault?.();
    setCreateError("");

    if (!createForm.titre.trim()) return setCreateError("Le titre est requis.");
    if (!createForm.categorie) return setCreateError("La catégorie est requise.");
    if (!createForm.type) return setCreateError("Le type est requis.");
    if (!createForm.date_debut || !createForm.date_fin)
      return setCreateError("Les dates de début et fin sont requises.");
    if (!currentUser?.id) return setCreateError("Utilisateur non connecté.");

    const fd = new FormData();
    fd.append("titre", createForm.titre);
    fd.append("description", createForm.description);
    fd.append("lieu", createForm.lieu);
    fd.append("type", createForm.type);
    fd.append("categorie", String(createForm.categorie));
    fd.append("association", String(currentUser.id));
    fd.append("date_debut", createForm.date_debut);
    fd.append("date_fin", createForm.date_fin);
    if (createForm.imageFile) fd.append("image", createForm.imageFile);

    setCreateLoading(true);
    try {
      const res = await axios.post(API_ANNONCES, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      const created = res?.data || null;
      const newItem =
        created && created.id
          ? created
          : {
              id: Math.random().toString(36).slice(2),
              ...createForm,
              image: created?.image || null,
              association: { id: currentUser.id },
              date_creation: new Date().toISOString(),
            };
      if (!newItem.association?.id) {
        newItem.association = { id: currentUser.id };
      }
      setAnnonces((prev) => [newItem, ...prev]);
      setCreateOpen(false);
    } catch (err) {
      console.error(err);
      setCreateError(
        err?.response?.data?.detail ||
          "Échec de la création. Vérifiez les champs et réessayez."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Header currentUser={null} />
        <div className="mt-4 text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
          Aucun utilisateur trouvé dans localStorage (clé "user").
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <Header currentUser={currentUser} />

      {/* Toolbar sticky */}
      <div className="sticky top-0 z-10 mt-4 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
        <Toolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onCreate={openCreate}
        />
      </div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KpiCard icon={LayoutList} label="Annonces" value={stats.total} />
        <KpiCard icon={Users} label="Candidatures" value={stats.totalCands} />
        <KpiCard icon={CheckCircle2} label="Acceptées" value={stats.acceptees} tone="success" />
        <KpiCard icon={AlertTriangle} label="Refusées" value={stats.refusees} tone="danger" />
        <KpiCard icon={Clock3} label="En attente" value={stats.enAttente} tone="warning" />
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">{error}</div>
        ) : filteredAnnonces.length === 0 ? (
          <EmptyState onReset={() => { setSearchTerm(""); setTypeFilter("TOUT"); setSortBy("recent"); }} />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredAnnonces.map((a) => {
              const cands = candsByAnnonce[a.id] || [];
              const reactions = 0; // placeholders
              const commentaires = 0;
              const badge = typeBadge(a.type);

              return (
                <li key={a.id} className="group border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* Media */}
                  <div className="h-44 w-full bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                    {a.image ? (
                      <img
                        src={typeof a.image === "string" ? a.image : URL.createObjectURL(a.image)}
                        alt={a.titre}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-slate-400">
                        <LayoutList className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-500">#{a.id}</div>
                        <h3 className="text-lg font-semibold leading-5 truncate">
                          {a.titre}
                        </h3>
                        <div className="mt-1 inline-flex items-center gap-2">
                          <TypeBadge {...badge} />
                          {a.lieu ? (
                            <div className="inline-flex items-center gap-1 text-xs text-slate-600">
                              <MapPin className="w-3.5 h-3.5" /> {a.lieu}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <IconButton title="Modifier" onClick={() => openEdit(a)}>
                          <Edit className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          title="Supprimer"
                          variant="danger"
                          onClick={() => onDeleteAnnonce(a.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </IconButton>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-3">{a.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{formatDateTime(a.date_debut)}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-medium">{formatDateTime(a.date_fin)}</span>
                      </span>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <MiniKpi icon={Users} value={cands.length} label="Candidatures" />
                      <MiniKpi icon={MessageCircle} value={commentaires} label="Commentaires" />
                      <MiniKpi icon={Heart} value={reactions} label="Réactions" />
                    </div>

                    {/* Candidatures */}
                    <div>
                      <button
                        onClick={() => setExpanded((p) => ({ ...p, [a.id]: !p[a.id] }))}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-sm px-3 py-2 border rounded-xl hover:bg-slate-50"
                      >
                        {expanded[a.id] ? (
                          <>Masquer les candidatures <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>Voir les candidatures ({cands.length}) <ChevronDown className="w-4 h-4" /></>
                        )}
                      </button>

                      {expanded[a.id] && (
                        <div className="mt-3 border rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                              <tr>
                                <th className="text-left px-3 py-2">#</th>
                                <th className="text-left px-3 py-2">Citoyen</th>
                                <th className="text-left px-3 py-2">Statut</th>
                                <th className="text-left px-3 py-2">Message</th>
                                <th className="text-left px-3 py-2">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cands.map((c) => (
                                <tr key={c.id} className="border-t">
                                  <td className="px-3 py-2">{c.id}</td>
                                  <td className="px-3 py-2">{c?.citoyen_details?.nom} {c?.citoyen_details?.prenom}</td>
                                  <td className="px-3 py-2">
                                    <StatusChip statut={c.statut} />
                                  </td>
                                  <td className="px-3 py-2 max-w-[220px] truncate" title={c.message}>
                                    {c.message}
                                  </td>
                                  <td className="px-3 py-2">{formatDateTime(c.date_candidature)}</td>
                                </tr>
                              ))}
                              {cands.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                                    Aucune candidature.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal d'édition (DYNAMIQUE) */}
      {editOpen && draft && (
        <Modal onClose={() => setEditOpen(false)} title="Modifier l'annonce">
          <form onSubmit={saveEditAnnonce} className="space-y-3">
            {editError && (
              <div className="text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg text-sm">
                {editError}
              </div>
            )}

            <Field label="Titre *">
              <input
                className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={draft.titre || ""}
                onChange={(e) => setDraft({ ...draft, titre: e.target.value })}
                required
              />
            </Field>

            <Field label="Description">
              <textarea
                className="w-full mt-1 px-3 py-2 border rounded-xl min-h-[110px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={draft.description || ""}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Lieu">
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={draft.lieu || ""}
                  onChange={(e) => setDraft({ ...draft, lieu: e.target.value })}
                />
              </Field>

              <Field label="Type *">
                <select
                  className="w-full mt-1 px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={draft.type || "EVENEMENT"}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                  required
                >
                  <option value="EVENEMENT">ÉVÉNEMENT</option>
                  <option value="DON">DON</option>
                  <option value="APPEL_BENEVOLAT">APPEL_BENEVOLAT</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Catégorie *">
                <select
                  className="w-full mt-1 px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={draft.categorie || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, categorie: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>— choisir —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Début *">
                  <input
                    type="datetime-local"
                    className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={draft.date_debut || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, date_debut: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="Fin *">
                  <input
                    type="datetime-local"
                    className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={draft.date_fin || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, date_fin: e.target.value })
                    }
                    required
                  />
                </Field>
              </div>
            </div>

            <Field label="Image (optionnel)">
              <div className="mt-1 flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-xl hover:bg-slate-50 cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  <span>Changer l’image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                  />
                </label>
                <span className="text-sm text-slate-600 truncate max-w-[240px]">
                  {editImageFile
                    ? editImageFile.name
                    : "Aucun fichier sélectionné"}
                </span>
              </div>
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 border rounded-xl hover:bg-slate-50"
                disabled={editLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={editLoading}
              >
                {editLoading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de création (DYNAMIQUE) */}
      {createOpen && (
        <Modal onClose={() => setCreateOpen(false)} title="Nouvelle annonce">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {createError && (
              <div className="text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg text-sm">
                {createError}
              </div>
            )}

            <Field label="Titre *">
              <input
                className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={createForm.titre}
                onChange={(e) => handleCreateChange("titre", e.target.value)}
                required
              />
            </Field>

            <Field label="Description">
              <textarea
                className="w-full mt-1 px-3 py-2 border rounded-xl min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={createForm.description}
                onChange={(e) => handleCreateChange("description", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Lieu">
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={createForm.lieu}
                  onChange={(e) => handleCreateChange("lieu", e.target.value)}
                />
              </Field>

              <Field label="Type *">
                <select
                  className="w-full mt-1 px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={createForm.type}
                  onChange={(e) => handleCreateChange("type", e.target.value)}
                  required
                >
                  <option value="EVENEMENT">ÉVÉNEMENT</option>
                  <option value="DON">DON</option>
                  <option value="APPEL_BENEVOLAT">APPEL_BENEVOLAT</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Catégorie *">
                <select
                  className="w-full mt-1 px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={createForm.categorie}
                  onChange={(e) => handleCreateChange("categorie", e.target.value)}
                  required
                >
                  <option value="" disabled>— choisir —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Début *">
                  <input
                    type="datetime-local"
                    className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={createForm.date_debut}
                    onChange={(e) => handleCreateChange("date_debut", e.target.value)}
                    required
                  />
                </Field>
                <Field label="Fin *">
                  <input
                    type="datetime-local"
                    className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={createForm.date_fin}
                    onChange={(e) => handleCreateChange("date_fin", e.target.value)}
                    required
                  />
                </Field>
              </div>
            </div>

            <Field label="Image">
              <div className="mt-1 flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-xl hover:bg-slate-50 cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  <span>Choisir un fichier</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleCreateChange("imageFile", e.target.files?.[0] || null)}
                  />
                </label>
                <span className="text-sm text-slate-600 truncate max-w-[240px]">
                  {createForm.imageFile ? createForm.imageFile.name : "Aucun fichier sélectionné"}
                </span>
              </div>
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 border rounded-xl hover:bg-slate-50"
                disabled={createLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={createLoading}
              >
                {createLoading ? "Enregistrement..." : "Créer"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========================
 *  Sous-composants UI
 * ========================= */

function Header({ currentUser }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl grid place-items-center bg-gradient-to-br from-blue-100 to-blue-50 ring-1 ring-inset ring-blue-200">
          <LayoutList className="w-5 h-5 text-blue-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Mes annonces</h1>
      </div>
      {currentUser && (
        <div className="text-sm text-slate-600">
          Connecté en tant que <span className="font-medium">#{currentUser?.id}</span>
        </div>
      )}
    </div>
  );
}

function Toolbar({ searchTerm, setSearchTerm, typeFilter, setTypeFilter, sortBy, setSortBy, onCreate }) {
  return (
    <div className="py-3 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, description ou lieu..."
              className="w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Rechercher"
            />
          </div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border rounded-xl hover:bg-slate-50"
            title="Créer une annonce"
            onClick={onCreate}
          >
            <Plus className="w-4 h-4" /> Nouvelle
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-xl bg-white"
            aria-label="Trier par"
          >
            <option value="recent">Plus récents</option>
            <option value="upcoming">Prochains d'abord</option>
            <option value="mostCands">+ de candidatures</option>
          </select>
        </div>
      </div>

      {/* Pills Type */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "TOUT", label: "Tous" },
          { id: "EVENEMENT", label: "Événement" },
          { id: "DON", label: "Don" },
          { id: "APPEL_BENEVOLAT", label: "Appel bénévolat" },
        ].map((t) => (
          <Pill
            key={t.id}
            active={typeFilter === t.id}
            onClick={() => setTypeFilter(t.id)}
          >
            {t.label}
          </Pill>
        ))}
        {(typeFilter !== "TOUT" || searchTerm) && (
          <button
            onClick={() => { setTypeFilter("TOUT"); setSearchTerm(""); setSortBy("recent"); }}
            className="ml-1 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
            aria-label="Réinitialiser les filtres"
          >
            <X className="w-4 h-4" /> Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-sm border transition-colors " +
        (active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
      }
    >
      {children}
    </button>
  );
}

function KpiCard({ icon: Icon, label, value, tone = "default" }) {
  const tones = {
    default: "from-slate-100 to-slate-50 ring-slate-200 text-slate-700",
    success: "from-emerald-100 to-emerald-50 ring-emerald-200 text-emerald-700",
    danger: "from-rose-100 to-rose-50 ring-rose-200 text-rose-700",
    warning: "from-amber-100 to-amber-50 ring-amber-200 text-amber-700",
  };
  const cls = tones[tone] || tones.default;
  return (
    <div className="p-4 border rounded-2xl bg-white shadow-sm flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl grid place-items-center bg-gradient-to-br ${cls} ring-1 ring-inset`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

function MiniKpi({ icon: Icon, value, label }) {
  return (
    <div className="border rounded-xl px-3 py-2 bg-slate-50 flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-600" />
      <div>
        <div className="text-sm font-semibold">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function IconButton({ children, onClick, title, variant = "default" }) {
  const base =
    "inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";
  const variants = {
    default: "hover:bg-slate-50",
    danger: "hover:bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <button title={title} onClick={onClick} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}

function TypeBadge({ label, cls }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

function typeBadge(type) {
  switch (type) {
    case "EVENEMENT":
      return { label: "Événement", cls: "bg-blue-50 text-blue-700 ring-blue-200" };
    case "DON":
      return { label: "Don", cls: "bg-rose-50 text-rose-700 ring-rose-200" };
    case "APPEL_BENEVOLAT":
      return { label: "Appel bénévolat", cls: "bg-amber-50 text-amber-700 ring-amber-200" };
    default:
      return { label: type || "-", cls: "bg-slate-50 text-slate-700 ring-slate-200" };
  }
}

function StatusChip({ statut }) {
  const map = {
    ACCEPTEE: { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "ACCEPTÉE" },
    REFUSEE: { icon: AlertTriangle, cls: "bg-rose-50 text-rose-700 ring-rose-200", label: "REFUSÉE" },
    EN_ATTENTE: { icon: Clock3, cls: "bg-amber-50 text-amber-700 ring-amber-200", label: "EN ATTENTE" },
  };
  const item = map[statut] || { icon: Clock3, cls: "bg-slate-50 text-slate-700 ring-slate-200", label: statut };
  const Icon = item.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ring-1 ring-inset ${item.cls}`}>
      <Icon className="w-3.5 h-3.5" /> {item.label}
    </span>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="border rounded-2xl bg-white shadow-sm p-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-inset ring-slate-200">
        <LayoutList className="w-7 h-7 text-slate-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Aucune annonce trouvée</h3>
      <p className="mt-1 text-slate-600">Modifiez vos filtres ou créez une nouvelle annonce.</p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <button onClick={onReset} className="px-4 py-2 border rounded-xl hover:bg-slate-50">Réinitialiser</button>
        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Nouvelle annonce</button>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="border rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="h-44 w-full bg-slate-100 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-slate-100 rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-8 bg-slate-100 rounded animate-pulse" />
              <div className="h-8 bg-slate-100 rounded animate-pulse" />
              <div className="h-8 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-9 bg-slate-100 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-white w-[95%] max-w-xl rounded-2xl shadow-2xl p-5 border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-600">{label}</span>
      {children}
    </label>
  );
}

// Utils
function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Convertit un ISO compatible <input type="datetime-local">
function normalizeLocal(iso) {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const da = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${y}-${m}-${da}T${h}:${mi}`;
}
