import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style/candidatures.css";
import { toast, ToastContainer } from "react-toastify";
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
      const response = await axios.get("http://127.0.0.1:8000/api/candidatures/mes/", { headers });
      
      // Trier les candidatures par date (du plus récent au plus ancien)
      const sortedCandidatures = response.data.sort((a, b) => 
        new Date(b.date_candidature) - new Date(a.date_candidature)
      );
      
      setCandidatures(sortedCandidatures);
      setLoading(false);
    } catch (err) {
      setError(err.message);
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

      toast.success(`Candidature ${newStatus === "ACCEPTEE" ? "acceptée" : "refusée"} avec succès!`);

      setCandidatures(candidatures.map(cand =>
        cand.id === candidatureId ? { ...cand, statut: newStatus } : cand
      ));
    } catch (err) {
      toast.error("Erreur lors de la mise à jour de la candidature");
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "ACCEPTEE":
        return "status-badge accepted";
      case "REFUSEE":
        return "status-badge rejected";
      case "EN_ATTENTE":
        return "status-badge pending";
      default:
        return "status-badge";
    }
  };

  // Fonction pour gérer la suppression d'une candidature
  const handleDeleteCandidature = async (candidatureId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(
        `http://127.0.0.1:8000/api/candidatures/mes/${candidatureId}/`,
        { headers }
      );

      toast.success("Candidature supprimée avec succès!");
      setCandidatures(candidatures.filter(cand => cand.id !== candidatureId));
    } catch (err) {
      toast.error("Erreur lors de la suppression de la candidature");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loader-overlay">
        <div className="simple-loader"></div>
      </div>
    );
  }
  if (error) return <div className="dashboard error">Erreur: {error}</div>;

  // Filtrer et trier les candidatures
  const filteredCandidatures = candidatures
    .filter((c) => {
      const now = new Date();
      const validStatus = statusFilter ? c.statut === statusFilter : true;
      const validStart = startAfterNow ? new Date(c.date_candidature) > now : true;
      const validEnd = endBeforeNow ? new Date(c.date_candidature) < now : true;
      return validStatus && validStart && validEnd;
    });

  return (
    <div className="dashboard">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}  // Les nouvelles notifications apparaissent en haut
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <h1>Mes Candidatures</h1>

      <div className="filters-container">
        <label>
          Statut :
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous</option>
            <option value="ACCEPTEE">Acceptée</option>
            <option value="REFUSEE">Refusée</option>
            <option value="EN_ATTENTE">En attente</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={startAfterNow}
            onChange={() => setStartAfterNow(!startAfterNow)}
          />
          Début après maintenant
        </label>

        <label>
          <input
            type="checkbox"
            checked={endBeforeNow}
            onChange={() => setEndBeforeNow(!endBeforeNow)}
          />
          Fin avant maintenant
        </label>
      </div>

      {filteredCandidatures.length > 0 ? (
        <div className="candidatures-list">
          {filteredCandidatures.map((candidature) => (
            <div key={candidature.id} className="candidature-card">
              <div className="candidature-header">
                <div>
                  <h3>{candidature.annonce_titre || `Candidature #${candidature.id}`}</h3>
                  <p className="candidature-date">{formatDate(candidature.date_candidature)}</p>
                </div>
                <span className={getStatusBadgeClass(candidature.statut)}>
                  {candidature.statut.replace("_", " ")}
                </span>
              </div>

              <div className="candidature-details">
                <p><strong>Association:</strong> {candidature.annonce_association || "Non spécifié"}</p>
                <p><strong>Message:</strong> {candidature.message}</p>
                {candidature.note_engagement && (
                  <p><strong>Note d'engagement:</strong> {candidature.note_engagement}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-candidatures">
          <p>Aucune candidature trouvée</p>
        </div>
      )}
    </div>
  );
}