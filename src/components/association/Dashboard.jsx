import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './style/AssDashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    annonces: 0,
    benevoles: 0,
    candidatures: 0,
    evenements: 0,
    deltaAnnonces: 0,
    deltaBenevoles: 0,
    deltaCandidatures: 0,
    deltaEvenements: 0
  });
  
  const [annonces, setAnnonces] = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch announcements
        const annoncesRes = await axios.get('http://127.0.0.1:8000/api/annonces/', { headers });
        setAnnonces(annoncesRes.data.slice(0, 6)); // Get last 6
        
        // Fetch applications
        const candidaturesRes = await axios.get('http://127.0.0.1:8000/api/candidatures/mes/', { headers });
        setCandidatures(candidaturesRes.data.slice(0, 6)); // Get last 6
        
        // Calculate statistics
        const totalAnnonces = annoncesRes.data.length;
        const acceptedCandidatures = new Set(
          candidaturesRes.data.filter(c => c.statut === 'ACCEPTEE').map(c => c.citoyen)
        ).size;
        const totalCandidatures = candidaturesRes.data.length;
        
        setStats({
          annonces: totalAnnonces,
          benevoles: acceptedCandidatures,
          candidatures: totalCandidatures,
          evenements: 5, // Example static value - replace with actual API data if available
          deltaAnnonces: 3, // Example - you might want to calculate this
          deltaBenevoles: 10, // Example - calculate from previous month
          deltaCandidatures: 15, // Example - calculate from previous month
          deltaEvenements: 2 // Example
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Tableau de bord - Les Amis de la Terre</h1>
        <p>Gérez vos annonces et vos bénévoles</p>
      </header>
      
      <div className="stats-grid">
  <div className="stat-card">
    <h3>Annonces publiées</h3>
    <div className="stat-value">10</div>
    <div className="stat-delta">+3 ce mois-ci</div>
  </div>
  <div className="stat-card">
    <h3>Bénévoles recrutés</h3>
    <div className="stat-value">2</div>
    <div className="stat-delta">+10 ce mois-ci</div>
  </div>
  <div className="stat-card">
    <h3>Candidatures reçues</h3>
    <div className="stat-value">32</div>
    <div className="stat-delta">+15 ce mois-ci</div>
  </div>
  <div className="stat-card">
    <h3>Événements organisés</h3>
    <div className="stat-value">5</div>
    <div className="stat-delta">+2 ce mois-ci</div>
  </div>
</div>
      
      <div className="dashboard-sections">
        <RecentAnnonces annonces={annonces} />
        <RecentCandidatures candidatures={candidatures} />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, delta }) => (
  <div className="stat-card">
    <h3>{title}</h3>
    <div className="stat-value">{value}</div>
    <div className="stat-delta">+{delta} ce mois-ci</div>
  </div>
);

// Recent Announcements Component
const RecentAnnonces = ({ annonces }) => (
  <div className="dashboard-section">
    <h2>Mes annonces récentes</h2>
    <p>Vos dernières publications</p>
    
    {annonces.map(annonce => (
      <div key={annonce.id} className="annonce-card">
        <h3>{annonce.titre}</h3>
        <p>{annonce.lieu}</p>
        <div className="annonce-meta">
          <span className="annonce-type">{annonce.type || 'benevolat'}</span>
          <span className="annonce-date">{new Date(annonce.date).toLocaleDateString()}</span>
          <span className="annonce-candidates">
            {annonce.candidatures_acceptees}/{annonce.candidatures_max} candidats
          </span>
        </div>
      </div>
    ))}
  </div>
);

// Recent Applications Component
const RecentCandidatures = ({ candidatures }) => (
  <div className="dashboard-section">
    <h2>Candidatures reçues</h2>
    <p>Nouvelles demandes de participation</p>
    
    {candidatures.map(candidature => (
      <div key={candidature.id} className="candidature-card">
        <h3>{candidature.citoyen_nom || `Candidat #${candidature.citoyen}`}</h3>
        <p>{candidature.annonce_titre || `Annonce #${candidature.annonce}`}</p>
        <div className={`candidature-status ${candidature.statut.toLowerCase()}`}>
          {candidature.statut === 'ACCEPTEE' ? 'Acceptée' : 
           candidature.statut === 'EN_ATTENTE' ? 'En attente' : 
           candidature.statut === 'REFUSEE' ? 'Refusée' : candidature.statut}
        </div>
        <div className="candidature-date">
          {new Date(candidature.date_candidature).toLocaleDateString()}
        </div>
      </div>
    ))}
  </div>
);

export default Dashboard;