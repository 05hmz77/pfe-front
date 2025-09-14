import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MyCandidature() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [startAfterNow, setStartAfterNow] = useState(false);
  const [endBeforeNow, setEndBeforeNow] = useState(false);

  useEffect(() => {
    fetchCandidatures();
  }, []);

  const fetchCandidatures = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        "http://127.0.0.1:8000/api/candidatures/mes/",
        { headers }
      );
      setCandidatures(response.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement.");
      setLoading(false);
      toast.error("Erreur lors du chargement des candidatures");
    }
  };

  const handleStatusChange = async (candidatureId, newStatus) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `http://127.0.0.1:8000/api/candidatures/mes/${candidatureId}/`,
        { statut: newStatus },
        { headers }
      );

      toast.success(
        `Candidature ${newStatus === "ACCEPTEE" ? "acceptée" : "refusée"} avec succès !`
      );

      // MAJ locale robuste
      setCandidatures((prev) =>
        prev.map((cand) =>
          cand.id === candidatureId ? { ...cand, statut: newStatus } : cand
        )
      );
    } catch (err) {
      toast.error("Erreur lors de la mise à jour de la candidature");
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Classes Tailwind pour les statuts
  const statusChip = (status) => {
    switch (status) {
      case "ACCEPTEE":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";
      case "REFUSEE":
        return "bg-rose-50 text-rose-700 ring-rose-200";
      case "EN_ATTENTE":
        return "bg-amber-50 text-amber-700 ring-amber-200";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-200";
    }
  };

  // Filtrage mémorisé
  const filtered = useMemo(() => {
    const now = new Date();
    return (candidatures || []).filter((c) => {
      const byStatus = statusFilter ? c.statut === statusFilter : true;
      const startOk = startAfterNow
        ? new Date(c.date_candidature) > now
        : true;
      const endOk = endBeforeNow
        ? new Date(c.date_candidature) < now
        : true;
      return byStatus && startOk && endOk;
    });
  }, [candidatures, statusFilter, startAfterNow, endBeforeNow]);

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 p-4">
          Erreur : {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 min-h-[80vh]">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Mes Candidatures</h1>
          <p className="text-slate-600 text-sm mt-1">
            Gérez vos candidatures et mettez à jour leur statut.
          </p>
        </div>
        <button
          onClick={fetchCandidatures}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
          title="Rafraîchir"
        >
          ↻ Rafraîchir
        </button>
      </div>

      {/* Toolbar filtres */}
      <div className="mt-4 bg-white border rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="text-sm text-slate-600">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="ACCEPTEE">Acceptée</option>
              <option value="REFUSEE">Refusée</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="startAfterNow"
              type="checkbox"
              checked={startAfterNow}
              onChange={() => setStartAfterNow((v) => !v)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="startAfterNow" className="text-sm text-slate-700">
              Début après maintenant
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="endBeforeNow"
              type="checkbox"
              checked={endBeforeNow}
              onChange={() => setEndBeforeNow((v) => !v)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="endBeforeNow" className="text-sm text-slate-700">
              Fin avant maintenant
            </label>
          </div>
        </div>

        {(statusFilter || startAfterNow || endBeforeNow) && (
          <div className="mt-3">
            <button
              onClick={() => {
                setStatusFilter("");
                setStartAfterNow(false);
                setEndBeforeNow(false);
              }}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Liste */}
      {filtered.length > 0 ? (
        <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((candidature) => (
            <li
              key={candidature.id}
              className="bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col"
            >
              {/* Header carte */}
              <div className="p-4 border-b flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] text-slate-500">
                    #{candidature.id}
                  </div>
                  <h3 className="text-lg font-semibold leading-5">
                    Candidature
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusChip(
                    candidature.statut
                  )}`}
                >
                  {candidature.statut.replace("_", " ")}
                </span>
              </div>

              {/* Détails */}
              <div className="p-4 text-sm text-slate-700 space-y-2">
                <p>
                  <span className="font-medium">Annonce ID :</span>{" "}
                  {candidature.annonce}
                </p>
                <p className="line-clamp-3">
                  <span className="font-medium">Message :</span>{" "}
                  {candidature.message || "—"}
                </p>
                <p>
                  <span className="font-medium">Date :</span>{" "}
                  {formatDate(candidature.date_candidature)}
                </p>
                {candidature.note_engagement && (
                  <p>
                    <span className="font-medium">Note d'engagement :</span>{" "}
                    {candidature.note_engagement}
                  </p>
                )}
              </div>

              {/* Actions */}
              {candidature.statut === "EN_ATTENTE" && (
                <div className="mt-auto p-4 border-t flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      handleStatusChange(candidature.id, "REFUSEE")
                    }
                    className="inline-flex items-center justify-center rounded-xl border border-rose-200 text-rose-700 px-3 py-2 text-sm hover:bg-rose-50"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() =>
                      handleStatusChange(candidature.id, "ACCEPTEE")
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700"
                  >
                    Accepter
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 border rounded-2xl bg-white shadow-sm p-10 text-center">
          <div className="mx-auto h-16 w-16 grid place-items-center rounded-2xl bg-gray-100 border">
            📭
          </div>
          <p className="mt-4 text-slate-700">
            {candidatures.length === 0
              ? "Aucune candidature trouvée."
              : "Aucun résultat avec ces filtres."}
          </p>
        </div>
      )}
    </div>
  );
}
