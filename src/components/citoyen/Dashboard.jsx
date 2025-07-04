import React, { useState, useEffect } from 'react';
import './style/Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    missions: 0,
    heures: 0,
    evaluation: 4.5, // Valeur statique comme demandé
    associations: 0
  });
  
  const [suggestions, setSuggestions] = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Token non trouvé');
        }

        // Récupération des candidatures
        const candidaturesResponse = await fetch('http://127.0.0.1:8000/api/candidatures/mes/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!candidaturesResponse.ok) {
          throw new Error('Erreur lors de la récupération des candidatures');
        }

        const candidaturesData = await candidaturesResponse.json();

        // Calcul des statistiques
        const now = new Date();
        const missionsAccomplies = candidaturesData.filter(c => 
          c.statut === 'ACCEPTEE' && new Date(c.annonce.date_fin) < now
        ).length;

        const associationsSoutenues = new Set(
          candidaturesData
            .filter(c => c.statut === 'ACCEPTEE')
            .map(c => c.annonce.association.nom)
        ).size;

        // Heures de bénévolat = nombre de candidatures en attente (exemple)
        const heuresBenevolat = candidaturesData.filter(c => 
          c.statut === 'EN_ATTENTE'
        ).length;

        setCandidatures(candidaturesData.slice(0, 3)); // 3 dernières candidatures
        setStats({
          missions: missionsAccomplies,
          heures: heuresBenevolat,
          evaluation: 4.5, // Valeur statique
          associations: associationsSoutenues
        });

        // Récupération des suggestions (exemple avec données statiques)
        const suggestionsResponse = await fetch('http://127.0.0.1:8000/api/annonces/suggestions/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (suggestionsResponse.ok) {
          const suggestionsData = await suggestionsResponse.json();
          setSuggestions(suggestionsData.slice(0, 3)); // 3 premières suggestions
        } else {
          // Fallback avec données statiques si l'API n'est pas disponible
          setSuggestions([
            {
              id: 1,
              titre: 'Nettoyage de plage',
              association: { nom: 'Les Amis de la Terre' },
              match: 95,
              lieu: 'Plage du Prado, Marseille',
              date: '2025-07-15',
              description: 'Basé sur votre intérêt pour l\'écologie'
            },
            {
              id: 2,
              titre: 'Plantation d\'arbres',
              association: { nom: 'Les Amis de la Terre' },
              match: 90,
              lieu: 'Forêt de Fontainebleau',
              date: '2025-10-15',
              description: 'Correspond à votre intérêt pour la protection de l\'environnement'
            }
          ]);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'ACCEPTEE': return { backgroundColor: '#E6F4EA', color: '#34A853' };
      case 'EN_ATTENTE': return { backgroundColor: '#FEF7E0', color: '#FBBC04' };
      case 'TERMINEE': return { backgroundColor: '#E8F0FE', color: '#4285F4' };
      default: return {};
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  const translateStatus = (status) => {
    switch(status) {
      case 'ACCEPTEE': return 'Acceptée';
      case 'EN_ATTENTE': return 'En attente';
      case 'TERMINEE': return 'Terminée';
      default: return status;
    }
  };

  if (loading) {
    return <div className="loading">Chargement en cours...</div>;
  }

  if (error) {
    return <div className="error">Erreur: {error}</div>;
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Bonjour Jean Dupont !</h1>
        <p>Voici un aperçu de votre engagement solidaire</p>
      </header>

      {/* Section Statistiques */}
      <section className="stats-section">
        <h2>Votre activité</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Missions accomplies</h3>
            <div className="stat-value">{stats.missions}</div>
            <div className="stat-change">+2 ce mois-ci</div>
          </div>
          
          <div className="stat-card">
            <h3>Heures de bénévolat</h3>
            <div className="stat-value">{stats.heures}</div>
            <div className="stat-change">+8 ce mois-ci</div>
          </div>
          
          <div className="stat-card">
            <h3>Évaluation moyenne</h3>
            <div className="stat-value">{stats.evaluation}</div>
            <div className="stat-change">+0.3 ce mois-ci</div>
          </div>
          
          <div className="stat-card">
            <h3>Associations soutenues</h3>
            <div className="stat-value">{stats.associations}</div>
            <div className="stat-change">+1 ce mois-ci</div>
          </div>
        </div>
      </section>

      {/* Section Suggestions */}
      <section className="suggestions-section">
        <h2>Suggestions pour vous</h2>
        <p className="subtitle">Recommandations basées sur vos intérêts</p>
        
        <div className="suggestions-grid">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="suggestion-card">
              <div className="suggestion-header">
                <h3>{suggestion.titre}</h3>
                <span className="association">{suggestion.association.nom}</span>
                <div className="match-badge">{suggestion.match}% match</div>
              </div>
              
              <div className="suggestion-details">
                <div className="location">{suggestion.lieu}</div>
                <div className="date">{formatDate(suggestion.date)}</div>
                <p>{suggestion.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section Candidatures */}
      <section className="applications-section">
        <h2>Mes candidatures récentes</h2>
        <p className="subtitle">Suivi de vos demandes de participation</p>
        
        <div className="applications-list">
          {candidatures.map((candidature) => (
            <div key={candidature.id} className="application-card">
              <div className="application-header">
                <h3>{candidature.annonce.titre}</h3>
                <span className="association">{candidature.annonce.association.nom}</span>
                <div 
                  className="status-badge"
                  style={getStatusStyle(candidature.statut)}
                >
                  {translateStatus(candidature.statut)}
                </div>
              </div>
              
              <div className="application-details">
                <div className="post-date">
                  Postulée le {formatDate(candidature.date_candidature)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="view-all-btn">Voir toutes mes candidatures</button>
      </section>
    </div>
  );
};

export default Dashboard;