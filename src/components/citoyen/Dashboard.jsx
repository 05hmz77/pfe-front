import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Toaster } from 'react-hot-toast'; 
import { toast } from "react-hot-toast";
import "./style/Dashboard.css";
import RecommendationCard from "./RecommendationCard ";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    recommendations: true,
  });
  const [error, setError] = useState({
    stats: null,
    recommendations: null,
  });
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsResponse = await axios.get(
          "http://localhost:8000/api/citoyen/dashboard/stats/",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStats(statsResponse.data);
        setLoading((prev) => ({ ...prev, stats: false }));

        // Fetch recommendations
        const recResponse = await axios.get(
          `http://localhost:8000/api/citoyen/${currentUser.id}/recommendations/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecommendations(
          Array.isArray(recResponse.data.recommendations)
            ? recResponse.data.recommendations
            : []
        );
        setLoading((prev) => ({ ...prev, recommendations: false }));
      } catch (err) {
        setError({
          stats: err.response?.data?.detail || err.message,
          recommendations: err.response?.data?.detail || err.message,
        });
        setLoading({ stats: false, recommendations: false });
        toast.error("Erreur lors du chargement des données");
      }
    };

    fetchData();
  }, [currentUser.id, token]);

  const handlePostulerClick = (annonce) => {
    setSelectedAnnonce(annonce);
    setShowModal(true);
  };

  const handleSubmitCandidature = async () => {
    try {
      const formData = {
        annonce: selectedAnnonce.id,
        statut: "EN_ATTENTE",
        message: message || "Je souhaite participer à cette annonce",
        date_candidature: new Date().toISOString(),
        citoyen: currentUser.id,
      };

      const res=await axios.post("http://127.0.0.1:8000/api/candidatures/", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Votre candidature a bien été envoyée !");
      ;
      if (res.status === 201) {
      toast.success('Candidature envoyée avec succès!', {
        icon: '👏',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      setShowModal(false);
      setMessage("");
      setRecommendations((prev) =>
        prev.filter((a) => a.id !== selectedAnnonce.id)
      )
    }
    } catch (err) {
      toast.error("Erreur lors de l'envoi de la candidature");
      console.error(err);
    }
  };

  if (loading.stats || loading.recommendations) {
    return (
      <div className="loader-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error.stats) {
    return <div className="error-message">Erreur: {error.stats}</div>;
  }

  if (!stats) {
    return <div className="no-data">Aucune donnée disponible</div>;
  }

  // Prepare chart data
  const typeData = stats.candidatures_by_type.map((item) => ({
    name: item.type,
    value: item.count,
  }));

  const categoryData = stats.candidatures_by_category.map((item) => ({
    name: item.nom,
    value: item.count,
  }));

  const COLORS = ["#4361ee", "#3f37c9", "#4895ef", "#4cc9f0", "#7209b7"];

  return (
    <div className="dashboard-container">
      <Toaster 
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          theme: {
            primary: 'green',
            secondary: 'black',
          },
        },
        error: {
          duration: 5000,
        },
      }}
    />
      <h1 className="dashboard-title">Tableau de bord Citoyen</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Candidatures</h3>
          <p className="stat-value">{stats.total_candidatures}</p>
        </div>
        <div className="stat-card">
          <h3>Candidatures Acceptées</h3>
          <p className="stat-value">{stats.accepted_candidatures}</p>
        </div>
        <div className="stat-card">
          <h3>Candidatures en Attente</h3>
          <p className="stat-value">{stats.pending_candidatures}</p>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Candidatures par Type</h3>
          <div className="chart-wrapper">
            <PieChart width={350} height={250}>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {typeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>

        <div className="chart-card">
          <h3>Candidatures par Catégorie</h3>
          <div className="chart-wrapper">
            <BarChart
              width={350}
              height={250}
              data={categoryData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index % 2 === 0 ? "#89CFF0" : "#D3D3D3"}
                  />
                ))}
              </Bar>
            </BarChart>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Dernières Candidatures</h2>
        <div className="candidatures-grid">
          {stats.recent_candidatures.map((cand) => (
            <div key={cand.id} className="card">
              <div className="card-header">
                <h4>{cand.annonce.titre}</h4>
                <span className={`status-badge ${cand.statut.toLowerCase()}`}>
                  {cand.statut}
                </span>
              </div>
              <p className="card-date">
                {new Date(cand.date_candidature).toLocaleDateString()}
              </p>
              <p className="card-content">
                {cand.message.substring(0, 100)}...
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Annonces suggérées pour vous</h2>
        {error.recommendations && (
          <div className="error-message">{error.recommendations}</div>
        )}
        {recommendations.length === 0 ? (
          <div className="no-recommendations">
            <p>Aucune recommandation disponible pour le moment.</p>
          </div>
        ) : (
          <div className="recommendations-grid">
            {recommendations.map((annonce) => (
              <RecommendationCard
                key={annonce.id}
                annonce={annonce}
                onPostulerClick={handlePostulerClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de candidature */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Postuler à {selectedAnnonce?.titre}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setMessage("");
                }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Votre message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Expliquez pourquoi vous souhaitez participer..."
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={() => {
                  setShowModal(false);
                  setMessage("");
                }}
              >
                Annuler
              </button>
              <button className="btn primary" onClick={handleSubmitCandidature}>
                Envoyer la candidature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;