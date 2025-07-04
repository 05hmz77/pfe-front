import React, { useState, useEffect } from "react";
import "./style/Dashboard.css";
import axios from "axios";

const Dashboard = () => {
  const [listAnnonces, setListAnnonces] = useState([]);
  const [listCandidature, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  // Calcul des métriques
  const missionsAccomplies = listCandidature.filter(c => 
    c.statut === "ACCEPTEE" && 
    new Date(listAnnonces.find(a => a.id === c.annonce)?.date_fin) < new Date()
  ).length;

  const associationsSoutenues = new Set(
    listCandidature
      .filter(c => c.statut === "ACCEPTEE")
      .map(c => listAnnonces.find(a => a.id === c.annonce)?.association?.nom)
      .filter(Boolean)
  ).size;

  const heuresBenevolat = listCandidature.filter(c => 
    c.statut === "EN_ATTENTE"
  ).length;

  // Suggestions (annonces non postulées)
  const suggestions = listAnnonces
    .filter(a => !listCandidature.some(c => c.annonce === a.id))
    .slice(0, 6);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Récupérer les annonces
        const annoncesRes = await axios.get(
          "http://localhost:8000/api/annonces/", 
          { headers }
        );
        setListAnnonces(annoncesRes.data || []);

        // Récupérer les candidatures
        const candidaturesRes = await axios.get(
          "http://127.0.0.1:8000/api/candidatures/mes/",
          { headers }
        );
        setCandidatures(candidaturesRes.data || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) {
    return <div className="loading">Chargement en cours...</div>;
  }

  if (error) {
    return <div className="error">Erreur: {error}</div>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Bonjour {currentUser?.username} !</h1>
        <p>Voici un aperçu de votre engagement solidaire</p>
      </header>

      <section className="metrics">
        <div className="metric-card">
          <div className="metric-header">
            <span className="icon">✅</span>
            <h3>Missions accomplies</h3>
          </div>
          <div className="metric-value">{missionsAccomplies}</div>
          <div className="metric-change">+{Math.floor(missionsAccomplies * 0.3)} ce mois-ci</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="icon">✅</span>
            <h3>Heures de bénévolat</h3>
          </div>
          <div className="metric-value">{heuresBenevolat}</div>
          <div className="metric-change">+{Math.floor(heuresBenevolat * 0.4)} ce mois-ci</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="icon">✅</span>
            <h3>Évaluation moyenne</h3>
          </div>
          <div className="metric-value">4.5</div>
          <div className="metric-change">+0.3 ce mois-ci</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="icon">✅</span>
            <h3>Associations soutenues</h3>
          </div>
          <div className="metric-value">{associationsSoutenues}</div>
          <div className="metric-change">+{Math.floor(associationsSoutenues * 0.5)} ce mois-ci</div>
        </div>
      </section>

      <section className="suggestions">
        <h2>Suggestions pour vous</h2>
        <p>Recommandations basées sur vos intérêts</p>
        
        <div className="suggestions-grid">
          {suggestions.map(annonce => (
            <div key={annonce.id} className="suggestion-card">
              <h3>{annonce.titre}</h3>
              <div className="association">{annonce.association?.nom}</div>
              <div className="match">{Math.floor(Math.random() * 20) + 80}% match</div>
              <div className="details">
                <p>{annonce.lieu}</p>
                <p>{formatDate(annonce.date_fin)}</p>
              </div>
              <p className="description">{annonce.description}</p>
            </div>
          ))}
        </div>
        
        <button className="see-all">Voir toutes les suggestions</button>
      </section>

      <section className="applications">
        <h2>Mes candidatures récentes</h2>
        <p>Suivi de vos demandes de participation</p>
        
        <div className="applications-list">
          {listCandidature.slice(0, 6).map(candidature => {
            const annonce = listAnnonces.find(a => a.id === candidature.annonce);
            return (
              <div key={candidature.id} className="application-card">
                <div className="application-header">
                  <h3>{annonce?.titre || 'Annonce inconnue'}</h3>
                  <div className={`status ${candidature.statut.toLowerCase()}`}>
                    {candidature.statut === "ACCEPTEE" && "Acceptée"}
                    {candidature.statut === "EN_ATTENTE" && "En attente"}
                    {candidature.statut === "TERMINEE" && "Terminée"}
                  </div>
                </div>
                <div className="association">{annonce?.association?.nom || 'Association inconnue'}</div>
                <div className="date">Postulé le {formatDate(candidature.date_candidature)}</div>
              </div>
            );
          })}
        </div>
        
        <button className="see-all">Voir toutes mes candidatures</button>
      </section>

      <section className="quick-actions">
        <h2>Actions rapides</h2>
        <p>Accédez rapidement aux fonctionnalités principales</p>
        
        <div className="actions-grid">
          <button className="action-button">Rechercher des annonces</button>
          <button className="action-button">Voir les événements</button>
          <button className="action-button">Assistance chatbot</button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;