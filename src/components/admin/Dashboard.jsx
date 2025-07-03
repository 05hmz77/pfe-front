import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";

const UserDetailsModal = ({ user, onClose }) => {
  const token = localStorage.getItem("accessToken");
  const [userCheck, setUserC] = useState(null); // Changed from UserCheck to userCheck
  const [msgErr, setMsgErr] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchUserDetails = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/users/${user.id}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.status === 200) {
          console.log(res.data);
          setUserC(res.data);
        } else {
          handleError(res.status);
        }
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des détails utilisateur:",
          err
        );
        setMsgErr(
          "Une erreur est survenue lors de la récupération des données"
        );
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
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
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
            <span style={{ color: user.is_active ? "green" : "red" }}>
              {user.is_active ? "Actif" : "Inactif"}
            </span>
          </div>

          {userCheck != null &&
          userCheck.type === "CITOYEN" &&
          userCheck.profile ? (
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
                <span>{userCheck.profile.bio || "Non renseigné"}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Expériences:</span>
                <span>{userCheck.profile.experiences || "Non renseigné"}</span>
              </div>
            </>
          ) : null}

          {userCheck != null &&
          userCheck.type === "ASSOCIATION" &&
          userCheck.profile ? (
            <>
              {console.log("je suid dans assosososos")}
              <div className="section-title">Profil Association</div>

              <div className="detail-row">
                <span className="detail-label">Nom:</span>
                <span>{userCheck.profile.nom}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span>{userCheck.profile.description || "Non renseigné"}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Contact:</span>
                <span>{userCheck.profile.contact || "Non renseigné"}</span>
              </div>
            </>
          ) : null}
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
        await Promise.all([fetchAnnonce(), fetchCandidature(), fetchUsers()]);
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
            (i) =>
              i.user_type.toUpperCase() === association.toUpperCase() &&
              i.is_active === true
          ).length
        );
        setListUserUnactive(res.data.filter((i) => i.is_active === false));
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
        setListUserUnactive(listUserUnactive.filter((i) => i.id !== id));
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

      <section className="dashboard-section">
        <section class="pending-section">
          <div className="section-header">
            <h2>Associations en attente</h2>
            <p className="section-subtitle">Demandes de validation à traiter</p>
          </div>

          <ul className="association-list">
            {listUserUnactive && listUserUnactive.length > 0 ? (
              listUserUnactive.slice(0, 6).map((i) => (
                <li key={i.id} className="association-card">
                  <div className="association-info">
                    <h3 className="association-name">{i.username}</h3>
                    <div className="association-category">
                      <span className="label">Domaine:</span>
                      <span>
                        {i.user_type === "association"
                          ? "Association"
                          : i.user_type}
                      </span>
                    </div>
                    <div className="association-address">
                      <span className="label">Adresse:</span>
                      <span>{i.address || "Adresse non renseignée"}</span>
                    </div>
                  </div>
                  <div className="association-actions">
                    <button
                      onClick={() => activateUsers(i.id)}
                      className="validate-btn"
                    >
                      Valider
                    </button>
                    <button>Rejeter</button>
                  </div>
                </li>
              ))
            ) : (
              <div className="no-associations">
                <p>Aucune association en attente de validation</p>
              </div>
            )}
          </ul>
        </section>

        <section class="activity-section">
          <div className="section-header">
            <h2>Activité récente</h2>
            <p className="section-subtitle">
              Dernières actions sur la plateforme
            </p>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">👤</div>
              <div className="activity-content">
                <h4>Nouvelle inscription</h4>
                <p>
                  Marie Dubois s'est inscrite comme citoyenne il y a 2 heures
                </p>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">📢</div>
              <div className="activity-content">
                <h4>Annonce publiée</h4>
                <p>
                  Les Amis de la Terre ont publié "Nettoyage de plage" il y a 4
                  heures
                </p>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-content">
                <h4>Association validée</h4>
                <p>La Croix-Rouge a été validée il y a 6 heures</p>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">👥</div>
              <div className="activity-content">
                <h4>Nouveau bénévole</h4>
                <p>
                  Jean Dupont a rejoint l'association Secours Populaire il y a 8
                  heures
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="quick-actions">
        <h1>Actions rapides</h1>
        <p>Accédez rapidement aux fonctionnalités d'administration</p>
        <div className="action-list">
          <div className="action-item">Gérer les associations</div>
          <div className="action-item checked">Gérer les utilisateurs</div>
          <div className="action-item">Voir les statistiques</div>
        </div>
      </section>
    </div>
  );
}
