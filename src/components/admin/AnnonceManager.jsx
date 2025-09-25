import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LayoutList,
  Search,
  Filter,
  Trash2,
  Edit,
  Calendar,
  MapPin,
  X,
  Plus,
} from "lucide-react";

// API endpoints
const API_ANNONCES = "http://127.0.0.1:8000/api/annonces/";
const API_CATEGORIES = "http://127.0.0.1:8000/api/categories/";

export default function AnnonceManager() {
  const token = localStorage.getItem("accessToken");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [annonces, setAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("TOUT");
  const [sortBy, setSortBy] = useState("recent");

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  // fetch annonces + catégories
  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [annRes, catRes] = await Promise.all([
        axios.get(API_ANNONCES, { headers }),
        axios.get(API_CATEGORIES, { headers }),
      ]);
      setAnnonces(annRes.data || []);
      setCategories(catRes.data || []);
    } catch (e) {
      setError("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // delete
  const onDeleteAnnonce = async (id) => {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    try {
      await axios.delete(`${API_ANNONCES}${id}/`, { headers });
      setAnnonces((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  // open edit
  const openEdit = (a) => {
    setDraft(a);
    setEditOpen(true);
  };

  // stats
  const stats = useMemo(() => {
    return {
      total: annonces.length,
      evenements: annonces.filter((a) => a.type === "EVENEMENT").length,
      dons: annonces.filter((a) => a.type === "DON").length,
      benevolat: annonces.filter((a) => a.type === "APPEL_BENEVOLAT").length,
    };
  }, [annonces]);

  // filtrage
  const filtered = useMemo(() => {
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
    if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
    } else if (sortBy === "upcoming") {
      list.sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut));
    }
    return list;
  }, [annonces, typeFilter, searchTerm, sortBy]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <LayoutList className="w-6 h-6 text-blue-600" /> Gestion des annonces
        </h1>
        <button
          onClick={() =>{} }
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Nouvelle annonce
        </button>
      </div>

      {/* Filtres */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-xl"
          >
            <option value="recent">Plus récents</option>
            <option value="upcoming">Prochains</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Kpi label="Total" value={stats.total} />
        <Kpi label="Événements" value={stats.evenements} />
        <Kpi label="Dons" value={stats.dons} />
        <Kpi label="Bénévolats" value={stats.benevolat} />
      </div>

      {/* Liste */}
      <div className="mt-6">
        {loading ? (
          <div className="text-slate-500">Chargement...</div>
        ) : error ? (
          <div className="text-rose-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-slate-500 text-center py-10">
            Aucune annonce trouvée
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="border rounded-2xl bg-white shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Image */}
                <div className="h-40 bg-slate-100">
                  {a.image ? (
                    <img
                      src={a.image}
                      alt={a.titre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full grid place-items-center text-slate-400">
                      <LayoutList className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg truncate">{a.titre}</h3>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {a.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4" /> {a.lieu}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" /> {formatDate(a.date_debut)} →{" "}
                    {formatDate(a.date_fin)}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => openEdit(a)}
                      className="px-3 py-1.5 border rounded-xl hover:bg-slate-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteAnnonce(a.id)}
                      className="px-3 py-1.5 border rounded-xl text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal Edition */}
      {editOpen && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditOpen(false)}
          />
          <div className="relative bg-white w-[95%] max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Modifier</h3>
              <button onClick={() => setEditOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="mt-4 space-y-3">
              <input
                className="w-full px-3 py-2 border rounded-xl"
                value={draft.titre}
                onChange={(e) =>
                  setDraft({ ...draft, titre: e.target.value })
                }
              />
              <textarea
                className="w-full px-3 py-2 border rounded-xl"
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl"
                  onClick={() => setEditOpen(false)}
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Sous composants --- */

function Kpi({ label, value }) {
  return (
    <div className="p-4 border rounded-2xl bg-white shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-blue-600">{value}</div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR");
}
