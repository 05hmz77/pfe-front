import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./style/Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    // stats (KPIs + graphiques)
    axios
      .get("http://localhost:8000/api/dashboard/stats/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));

    // activités récentes
    axios
      .get("http://localhost:8000/api/dashboard/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setActivities(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats || !activities) {
    return (
      <p className="dashboard-loading-text">
        ⏳ Chargement du tableau de bord...
      </p>
    );
  }

  return (
    <div className="dashboard-admin-container">
      {/* ==== KPIs ==== */}
      <div className="dashboard-kpi-grid">
        <div className="dashboard-card dashboard-kpi-card dashboard-users-card">
          <h3 className="dashboard-card-title">👥 Utilisateurs</h3>
          <p>Total : {stats.utilisateurs.total}</p>
          <p>Associations : {stats.utilisateurs.associations}</p>
          <p>Citoyens : {stats.utilisateurs.citoyens}</p>
          <p>Nouveaux ce mois : {stats.utilisateurs.nouveaux_ce_mois}</p>
        </div>

        <div className="dashboard-card dashboard-kpi-card dashboard-annonces-card">
          <h3 className="dashboard-card-title">📢 Annonces</h3>
          <p>Total : {stats.annonces.total}</p>
          <p>En cours : {stats.annonces.en_cours}</p>
          <p>Terminées : {stats.annonces.terminees}</p>
        </div>

        <div className="dashboard-card dashboard-kpi-card dashboard-candidatures-card">
          <h3 className="dashboard-card-title">🙋‍♂️ Candidatures</h3>
          <p>Total : {stats.candidatures.total}</p>
          <p>
            Engagement moyen :{" "}
            {stats.candidatures.engagement_moyen
              ? stats.candidatures.engagement_moyen.toFixed(1)
              : "N/A"}
          </p>
        </div>

        <div className="dashboard-card dashboard-kpi-card dashboard-messages-card">
          <h3 className="dashboard-card-title">💬 Messages</h3>
          <p>Total : {stats.messages.total}</p>
        </div>
      </div>

      {/* ==== Graphiques ==== */}
      <div className="dashboard-chart-grid">
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">📊 Annonces par type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.annonces.par_type}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <h3 className="dashboard-card-title">📌 Candidatures par statut</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.candidatures.par_statut}
                dataKey="count"
                nameKey="statut"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {stats.candidatures.par_statut.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={["#10b981", "#f59e0b", "#ef4444"][index % 3]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ==== Top 5 ==== */}
      <div className="dashboard-chart-grid">
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">🏆 Top annonces</h3>
          <ul className="dashboard-top-list">
            {stats.candidatures.top_annonces.map((a, i) => (
              <li key={i}>
                <span>{a.annonce__titre}</span>
                <span className="dashboard-count">{a.total}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dashboard-card">
          <h3 className="dashboard-card-title">🏅 Top citoyens</h3>
          <ul className="dashboard-top-list">
            {stats.candidatures.top_citoyens.map((c, i) => (
              <li key={i}>
                <span>
                  {c.citoyen__prenom} {c.citoyen__nom}
                </span>
                <span className="dashboard-count">{c.total}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="dashboard-activities-container">
        {/* Nouveaux utilisateurs */}
        <div className="dashboard-activity-card">
          <h4>👥 Nouveaux utilisateurs</h4>
          <ul className="dashboard-activity-list">
            {activities.recent_users.map((u) => (
              <li key={u.id} className="user">
                <span className="activity-title">
                  {u.username} ({u.type})
                </span>
                <span className="activity-desc">{u.email}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dernières annonces */}
        <div className="dashboard-activity-card">
          <h4>📢 Dernières annonces</h4>
          <ul className="dashboard-activity-list">
            {activities.recent_annonces.map((a) => (
              <li key={a.id} className="annonce">
                <span className="activity-title">
                  {a.titre} ({a.type})
                </span>
                <span className="activity-desc">{a.lieu}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dernières candidatures */}
        <div className="dashboard-activity-card">
          <h4>🙋‍♂️ Dernières candidatures</h4>
          <ul className="dashboard-activity-list">
            {activities.recent_candidatures.map((c) => (
              <li key={c.id} className="candidature">
                <span className="activity-title">
                  Candidature #{c.id} – {c.statut}
                </span>
                <span className="activity-desc">{c.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
