import React, { useState, useEffect } from "react";
import axios from "axios";
import './Dashboard.css';

const UserDetailsModal = ({ user, onClose }) => {
  const token = localStorage.getItem("accessToken");
  const [userCheck, setUserC] = useState(null);  // Changed from UserCheck to userCheck
  const [msgErr, setMsgErr] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchUserDetails = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/users/${user.id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          console.log(res.data)
          setUserC(res.data);
        } else {
          handleError(res.status);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des détails utilisateur:", err);
        setMsgErr("Une erreur est survenue lors de la récupération des données");
      }
    };

    fetchUserDetails();
  }, [user, token]);

  const handleError = (status) => {
    if (status === 410 || status === 403) {
      setMsgErr("Vous n'êtes pas autorisé pour cette action");
    } else {
      setMsgErr("Un problème côté serveur");
    }
  };

  if (!user) return null;

   return (
    <div className="user-details-modal">
      <div className="user-details-content">
        <div className="user-details-header">
          <h2>Détails de l'utilisateur</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="user-details-body">
          <div className="section-title">Informations de base</div>
          
          <div className="detail-row">
            <span className="detail-label">Username:</span>
            <span>{user.username}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span>{user.email}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Type:</span>
            <span>{user.user_type}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Statut:</span>
            <span style={{ color: user.is_active ? 'green' : 'red' }}>
              {user.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>

          {userCheck!=null && userCheck.type === 'CITOYEN' && userCheck.profile ? (
            <>
              <div className="section-title">Profil Citoyen</div>
              
              <div className="detail-row">
                <span className="detail-label">Nom:</span>
                <span>{userCheck.profile.nom}</span>
                
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Prénom:</span>
                <span>{userCheck.profile.prenom}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Bio:</span>
                <span>{userCheck.profile.bio || 'Non renseigné'}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Expériences:</span>
                <span>{userCheck.profile.experiences || 'Non renseigné'}</span>
              </div>
            </>
          ):null}

          {userCheck!=null && userCheck.type === 'ASSOCIATION' && userCheck.profile ? (
            
            <>
            {console.log("je suid dans assosososos")}
              <div className="section-title">Profil Association</div>
              
              <div className="detail-row">
                <span className="detail-label">Nom:</span>
                <span>{userCheck.profile.nom}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span>{userCheck.profile.description || 'Non renseigné'}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Contact:</span>
                <span>{userCheck.profile.contact || 'Non renseigné'}</span>
              </div>
              
              
              
             
            </>
          ):null}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");
  const [msgErr, setMsgErr] = useState(null);
  const [nbUsers, setNbUsers] = useState(0);
  const [nbCandidature, setNbCandidature] = useState(0);
  const [nbAnnonce, setNbAnnonce] = useState(0);
  const [nbAssociation, setNbAssociation] = useState(0);
  const [listUserUnactive, setListUserUnactive] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchAnnonce(),
          fetchCandidature(),
          fetchUsers()
        ]);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setMsgErr("Une erreur est survenue lors du chargement des données");
      }
    };

    fetchData();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/users/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        const association = "association";
        setNbUsers(res.data.length);
        setNbAssociation(
          res.data.filter(
            i => i.user_type.toUpperCase() === association.toUpperCase() &&
                 i.is_active === true
          ).length
        );
        setListUserUnactive(res.data.filter(i => i.is_active === false));
      } else {
        handleError(res.status);
      }
    } catch (err) {
      console.error("Erreur utilisateur:", err);
      setMsgErr("Erreur lors de la récupération des utilisateurs");
    }
  };

  const fetchCandidature = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/candidatures/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setNbCandidature(res.data.length);
      } else {
        handleError(res.status);
      }
    } catch (err) {
      console.error("Erreur candidature:", err);
      setMsgErr("Erreur lors de la récupération des candidatures");
    }
  };

  const fetchAnnonce = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/annonces/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setNbAnnonce(res.data.length);
      } else {
        handleError(res.status);
      }
    } catch (err) {
      console.error("Erreur annonce:", err);
      setMsgErr("Erreur lors de la récupération des annonces");
    }
  };

  const handleError = (status) => {
    if (status === 410 || status === 403) {
      setMsgErr("Vous n'êtes pas autorisé pour cette action");
    } else {
      setMsgErr("Un problème côté serveur");
    }
  };

  const activateUsers = async (id) => {
    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/activate/${id}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        setListUserUnactive(listUserUnactive.filter(i => i.id !== id));
      } else {
        handleError(res.status);
      }
    } catch (err) {
      console.error("Erreur activation:", err);
      setMsgErr("Erreur lors de l'activation de l'utilisateur");
    }
  };

  const handleView = (user) => {
    setSelectedUser(user);
  };

  return (
    <div className="dashboard">
      {msgErr && <div className="error-message">{msgErr}</div>}
      
      <header className="dashboard-header">
        <h1>
          Bonjour <span className="username">{currentUser.username}</span> dans
          votre espace Admin
        </h1>
        <p className="subtitle">Merci de gérer la plateforme SolidarLink</p>
      </header>

      <section className="statistics-app">
        <div className="card">
          <div className="card-label">Nombre d'utilisateurs</div>
          <div className="card-value">{nbUsers}</div>
        </div>
        <div className="card">
          <div className="card-label">Nombre d'associations</div>
          <div className="card-value">{nbAssociation}</div>
        </div>
        <div className="card">
          <div className="card-label">Nombre de candidatures</div>
          <div className="card-value">{nbCandidature}</div>
        </div>
        <div className="card">
          <div className="card-label">Nombre d'annonces</div>
          <div className="card-value">{nbAnnonce}</div>
        </div>
      </section>

      <section className="validate-users">
        <div>
          <ul>
            {listUserUnactive && listUserUnactive.length > 0 ? (
              listUserUnactive.slice(0, 6).map(i => (
                <li key={i.id} className="user-card">
                  <div className="user-info">
                    <div className="user-name">
                      <span className="label">Nom:</span>
                      <strong>{i.username}</strong>
                    </div>
                    <div className="user-status">
                      <span className="label">Statut:</span>
                      <span className={i.is_active ? "active" : "inactive"}>
                        {i.is_active ? "Actif" : "Inactif"}
                      </span>
                    </div>
                    <div className="user-type">
                      <span className="label">Type:</span>
                      <strong>{i.user_type}</strong>
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      onClick={() => activateUsers(i.id)}
                      className="activate-btn"
                    >
                      Activer
                    </button>
                    <button 
                      onClick={() => handleView(i)} 
                      className="view-btn"
                    >
                      Voir
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <div className="no-users">
                <p>Aucun utilisateur inactif pour le moment</p>
              </div>
            )}
          </ul>
          {selectedUser && (
            <UserDetailsModal 
              user={selectedUser} 
              onClose={() => setSelectedUser(null)} 
            />
          )}
        </div>
      </section>

      <section className="quick-actions">
        <div className="quick-actions">
          <h1>Actions rapides</h1>
          <p>Accédez rapidement aux fonctionnalités d'administration</p>
          <div className="action-item">
            <label htmlFor="associations">Gérer les associations</label>
          </div>

          <div className="action-item checked">
            <label htmlFor="utilisateurs">Gérer les utilisateurs</label>
          </div>

          <div className="action-item">
            <label htmlFor="statistiques">Voir les statistiques</label>
          </div>
        </div>
      </section>
    </div>
  );
}