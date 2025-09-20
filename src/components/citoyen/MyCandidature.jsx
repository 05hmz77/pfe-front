import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MyCandidature() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCandidatures();
  }, []);

  const fetchCandidatures = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get("http://127.0.0.1:8000/api/candidatures/mes/", { headers });

      const sorted = response.data.sort(
        (a, b) => new Date(b.date_candidature) - new Date(a.date_candidature)
      );

      setCandidatures(sorted);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast.error("Erreur lors du chargement des candidatures");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "ACCEPTEE":
        return "bg-green-100 text-green-700 ring-1 ring-green-300";
      case "REFUSEE":
        return "bg-red-100 text-red-700 ring-1 ring-red-300";
      case "EN_ATTENTE":
        return "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300";
      default:
        return "bg-gray-100 text-gray-600 ring-1 ring-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (error) return <div className="text-red-600 font-semibold">Erreur: {error}</div>;

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <h1 className="text-2xl font-bold text-gray-800 mb-6">📄 Mes Candidatures</h1>

      {candidatures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidatures.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition flex flex-col"
            >
              {/* Header box */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {c.annonce_titre || `Candidature #${c.id}`}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                    c.statut
                  )}`}
                >
                  {c.statut.replace("_", " ")}
                </span>
              </div>

              {/* Body box */}
              <div className="flex-1 p-4 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Association :</span>{" "}
                  {c.annonce_association || "Non spécifié"}
                </p>
                <p>
                  <span className="font-medium">Message :</span> {c.message}
                </p>
                {c.note_engagement && (
                  <p>
                    <span className="font-medium">Note d'engagement :</span>{" "}
                    {c.note_engagement}
                  </p>
                )}
              </div>

              {/* Footer box */}
              <div className="p-4 border-t border-gray-100 text-xs text-gray-500">
                {formatDate(c.date_candidature)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border rounded-xl shadow-sm">
          <p className="text-gray-500">Aucune candidature trouvée</p>
        </div>
      )}
    </div>
  );
}
