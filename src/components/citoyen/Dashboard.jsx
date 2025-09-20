import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Clock, Heart, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function CitoyenDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const headers = { Authorization: `Bearer ${token}` };
    axios
      .get("http://localhost:8000/api/citoyen/dashboard/", { headers })
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!data)
    return (
      <p className="text-center text-gray-500 font-medium mt-10 animate-pulse">
        Chargement du tableau de bord...
      </p>
    );

  const COLORS = ["#10B981", "#EF4444", "#F59E0B", "#3B82F6"];

  return (
    <div className="p-8 space-y-10 bg-gradient-to-br from-gray-100 via-white to-gray-100 min-h-screen">
      {/* === Header === */}
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">
          Dashboard Citoyen
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Vue d’ensemble de votre activité et statistiques personnelles
        </p>
      </div>

      {/* === Statistiques rapides === */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { label: "Candidatures", value: data.analytics.total_candidatures, color: "text-blue-600" },
          { label: "Acceptées", value: data.analytics.accepted, color: "text-green-600" },
          { label: "Refusées", value: data.analytics.refused, color: "text-red-600" },
          { label: "Succès", value: `${data.analytics.success_rate}%`, color: "text-indigo-600" },
          { label: "Engagement", value: data.analytics.avg_engagement, color: "text-purple-600" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 text-center"
          >
            <p className="text-sm uppercase font-medium tracking-wide text-gray-400">
              {stat.label}
            </p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* === Graphiques === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Répartition candidatures */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Répartition des Candidatures
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: "Acceptées", value: data.analytics.accepted },
                  { name: "Refusées", value: data.analytics.refused },
                  { name: "En attente", value: data.analytics.pending },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label
              >
                {COLORS.map((c, i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Candidatures par mois */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Candidatures par Mois
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.analytics.candidatures_by_month}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Candidatures par type */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Candidatures par Type d’Annonce
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.analytics.candidatures_by_type}>
              <XAxis dataKey="annonce__type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Réactions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Réactions données
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.analytics.reactions_by_type}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="count"
                nameKey="type"
                label
              >
                {COLORS.map((c, i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

            {/* === Activité récente (nouveau style) === */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
          <Clock className="mr-2 text-indigo-500" /> Activité Récente
        </h2>

        <div className="space-y-4">
          {/* Candidatures */}
          {data.recent_activity.candidatures.map((c, idx) => (
            <motion.div
              key={`cand-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="p-2 bg-indigo-500 text-white rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Candidature à <strong className="text-gray-900">{c.annonce__titre}</strong>
                </p>
                <p className="text-xs font-medium text-indigo-600 mt-1">
                  Statut : {c.statut}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(c.date_candidature).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Commentaires */}
          {data.recent_activity.commentaires.map((cm, idx) => (
            <motion.div
              key={`com-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx + 5) * 0.1 }}
              className="flex items-start gap-4 bg-green-50 border border-green-100 rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="p-2 bg-green-500 text-white rounded-lg">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Commentaire sur <strong className="text-gray-900">{cm.annonce__titre}</strong>
                </p>
                <p className="text-xs italic text-gray-500 mt-1">"{cm.contenu}"</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(cm.date_creation).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Réactions */}
          {data.recent_activity.reactions.map((r, idx) => (
            <motion.div
              key={`react-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx + 10) * 0.1 }}
              className="flex items-start gap-4 bg-red-50 border border-red-100 rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="p-2 bg-red-500 text-white rounded-lg">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Réaction <strong className="capitalize text-gray-900">{r.type}</strong> sur{" "}
                  <strong className="text-gray-900">{r.annonce__titre}</strong>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(r.date_creation).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
