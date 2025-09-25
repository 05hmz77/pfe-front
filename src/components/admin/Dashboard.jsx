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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    axios
      .get("http://localhost:8000/api/dashboard/stats/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));

    axios
      .get("http://localhost:8000/api/dashboard/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setActivities(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats || !activities) {
    return (
      <div className="flex justify-center items-center h-64 text-blue-400 font-semibold">
        ⏳ Chargement du tableau de bord...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-white min-h-screen">
      {/* ==== KPIs ==== */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="👥 Utilisateurs"
          items={[
            `Total : ${stats.utilisateurs.total}`,
            `Associations : ${stats.utilisateurs.associations}`,
            `Citoyens : ${stats.utilisateurs.citoyens}`,
            `Nouveaux ce mois : ${stats.utilisateurs.nouveaux_ce_mois}`,
          ]}
          accent="blue"
        />
        <KpiCard
          title="📢 Annonces"
          items={[
            `Total : ${stats.annonces.total}`,
            `En cours : ${stats.annonces.en_cours}`,
            `Terminées : ${stats.annonces.terminees}`,
          ]}
          accent="emerald"
        />
        <KpiCard
          title="🙋‍♂️ Candidatures"
          items={[
            `Total : ${stats.candidatures.total}`,
            `Engagement moyen : ${
              stats.candidatures.engagement_moyen
                ? stats.candidatures.engagement_moyen.toFixed(1)
                : "N/A"
            }`,
          ]}
          accent="amber"
        />
        <KpiCard
          title="💬 Messages"
          items={[`Total : ${stats.messages.total}`]}
          accent="rose"
        />
      </div>

      {/* ==== Graphiques ==== */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Panel title="📊 Annonces par type" accent="blue">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.annonces.par_type}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#60A5FA" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="📌 Candidatures par statut" accent="emerald">
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
                {stats.candidatures.par_statut.map((_, index) => (
                  <Cell
                    key={index}
                    fill={["#34D399", "#FBBF24", "#F87171"][index % 3]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ==== Top 5 ==== */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Panel title="🏆 Top annonces" accent="amber">
          <ul className="divide-y divide-gray-200">
            {stats.candidatures.top_annonces.map((a, i) => (
              <li
                key={i}
                className="flex justify-between py-2 text-sm font-medium text-gray-700"
              >
                <span>{a.annonce__titre}</span>
                <span className="px-2 py-1 text-white bg-amber-400 rounded-md text-xs">
                  {a.total}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="🏅 Top citoyens" accent="rose">
          <ul className="divide-y divide-gray-200">
            {stats.candidatures.top_citoyens.map((c, i) => (
              <li
                key={i}
                className="flex justify-between py-2 text-sm font-medium text-gray-700"
              >
                <span>
                  {c.citoyen__prenom} {c.citoyen__nom}
                </span>
                <span className="px-2 py-1 text-white bg-rose-400 rounded-md text-xs">
                  {c.total}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ==== Activités récentes ==== */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <ActivityCard
          title="👥 Nouveaux utilisateurs"
          accent="blue"
          items={activities.recent_users.map((u) => ({
            id: u.id,
            title: `${u.username} (${u.type})`,
            desc: u.email,
          }))}
        />

        <ActivityCard
          title="📢 Dernières annonces"
          accent="emerald"
          items={activities.recent_annonces.map((a) => ({
            id: a.id,
            title: `${a.titre} (${a.type})`,
            desc: a.lieu,
          }))}
        />

        <ActivityCard
          title="🙋‍♂️ Dernières candidatures"
          accent="rose"
          items={activities.recent_candidatures.map((c) => ({
            id: c.id,
            title: `Candidature #${c.id} – ${c.statut}`,
            desc: c.message,
          }))}
        />
      </div>
    </div>
  );
}

/* === Composants UI === */
function KpiCard({ title, items, accent }) {
  const accentColors = {
    blue: "border-blue-400 text-blue-600",
    emerald: "border-emerald-400 text-emerald-600",
    amber: "border-amber-400 text-amber-600",
    rose: "border-rose-400 text-rose-600",
  };

  return (
    <div
      className={`bg-white shadow rounded-xl p-4 border-t-4 ${
        accentColors[accent] || "border-blue-400 text-blue-600"
      }`}
    >
      <h3 className="font-semibold mb-2">{title}</h3>
      <ul className="space-y-1 text-sm text-gray-700">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function Panel({ title, children, accent }) {
  const accentColors = {
    blue: "border-blue-400",
    emerald: "border-emerald-400",
    amber: "border-amber-400",
    rose: "border-rose-400",
  };

  return (
    <div
      className={`bg-white shadow rounded-xl p-4 border ${
        accentColors[accent] || "border-blue-400"
      }`}
    >
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ActivityCard({ title, items, accent }) {
  const accentColors = {
    blue: "border-blue-400",
    emerald: "border-emerald-400",
    amber: "border-amber-400",
    rose: "border-rose-400",
  };

  return (
    <div
      className={`bg-white shadow rounded-xl p-4 border ${
        accentColors[accent] || "border-blue-400"
      }`}
    >
      <h4 className="font-semibold text-gray-800 mb-4">{title}</h4>
      <ul className="divide-y divide-gray-200">
        {items.map((it) => (
          <li key={it.id} className="py-2">
            <div className="text-sm font-medium text-gray-800">{it.title}</div>
            <div className="text-xs text-gray-500">{it.desc}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
