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
  Legend
} from "recharts";
import { Clock, Heart, MessageCircle, TrendingUp, Users, Target, BarChart3, Activity, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function CitoyenDashboard() {
  const [data, setData] = useState(null);
  const [activeActivityTab, setActiveActivityTab] = useState("toutes");

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium text-lg">Chargement du tableau de bord...</p>
        </div>
      </div>
    );

  const BLUE_COLORS = ["#60A5FA", "#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF"];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  // Filtrer les activités selon l'onglet actif
  const filteredActivities = {
    toutes: [
      ...data.recent_activity.candidatures.map(a => ({ ...a, type: 'candidature' })),
      ...data.recent_activity.commentaires.map(a => ({ ...a, type: 'commentaire' })),
      ...data.recent_activity.reactions.map(a => ({ ...a, type: 'reaction' }))
    ].sort((a, b) => new Date(b.date_candidature || b.date_creation) - new Date(a.date_candidature || a.date_creation)),
    candidatures: data.recent_activity.candidatures.map(a => ({ ...a, type: 'candidature' })),
    commentaires: data.recent_activity.commentaires.map(a => ({ ...a, type: 'commentaire' })),
    reactions: data.recent_activity.reactions.map(a => ({ ...a, type: 'reaction' }))
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'candidature': return <Clock className="w-5 h-5" />;
      case 'commentaire': return <MessageCircle className="w-5 h-5" />;
      case 'reaction': return <Heart className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'candidature': return 'blue';
      case 'commentaire': return 'green';
      case 'reaction': return 'red';
      default: return 'gray';
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'ACCEPTEE': return 'bg-green-100 text-green-800 border-green-200';
      case 'REFUSEE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="p-6 space-y-8 bg-white min-h-screen rounded-[32px] border">
      {/* === Header === */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
          Dashboard Citoyen
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Analyse complète de votre engagement citoyen et de votre impact
        </p>
      </motion.div>

      {/* === Statistiques rapides === */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          { 
            label: "Total Candidatures", 
            value: data.analytics.total_candidatures, 
            icon: <BarChart3 className="w-8 h-8" />,
            color: "from-blue-500 to-blue-600",
            bg: "bg-gradient-to-br from-blue-50 to-blue-100"
          },
          { 
            label: "Candidatures Acceptées", 
            value: data.analytics.accepted, 
            icon: <Target className="w-8 h-8" />,
            color: "from-green-500 to-green-600",
            bg: "bg-gradient-to-br from-green-50 to-green-100"
          },
          { 
            label: "Taux de Succès", 
            value: `${data.analytics.success_rate}%`, 
            icon: <TrendingUp className="w-8 h-8" />,
            color: "from-purple-500 to-purple-600",
            bg: "bg-gradient-to-br from-purple-50 to-purple-100"
          },
          { 
            label: "Niveau d'Engagement", 
            value: data.analytics.avg_engagement, 
            icon: <Activity className="w-8 h-8" />,
            color: "from-orange-500 to-orange-600",
            bg: "bg-gradient-to-br from-orange-50 to-orange-100"
          },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className={`${stat.bg} rounded-2xl border border-gray-200 hover:border-blue-400 transition-all duration-300 p-6 group hover:scale-105 shadow-sm hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white`}>
                {stat.icon}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium uppercase tracking-wider">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* === Graphiques Principaux === */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Répartition candidatures */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Répartition des Candidatures
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Acceptées", value: data.analytics.accepted },
                  { name: "Refusées", value: data.analytics.refused },
                  { name: "En attente", value: data.analytics.pending },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {BLUE_COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Candidatures par mois */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Évolution Mensuelle
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.analytics.candidatures_by_month}>
              <XAxis 
                dataKey="month" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#2563EB' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Candidatures par type */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Par Type d'Annonce
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.analytics.candidatures_by_type}>
              <XAxis 
                dataKey="annonce__type" 
                stroke="#6B7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip />
              <Bar 
                dataKey="count" 
                fill="url(#blueGradient)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Réactions */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-blue-600" />
            Réactions Données
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.analytics.reactions_by_type}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
                nameKey="type"
                label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
              >
                {BLUE_COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      {/* === Activité récente avec onglets === */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-4 sm:mb-0">
            <Calendar className="text-blue-600" /> 
            Activité Récente
          </h2>
          
          {/* Onglets de filtrage */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: "toutes", label: "Toutes", count: filteredActivities.toutes.length },
              { key: "candidatures", label: "Candidatures", count: filteredActivities.candidatures.length },
              { key: "commentaires", label: "Commentaires", count: filteredActivities.commentaires.length },
              { key: "reactions", label: "Réactions", count: filteredActivities.reactions.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveActivityTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeActivityTab === tab.key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label} 
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeActivityTab === tab.key ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredActivities[activeActivityTab].length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg">Aucune activité trouvée</div>
              <p className="text-gray-500 text-sm">Vos activités apparaîtront ici</p>
            </div>
          ) : (
            filteredActivities[activeActivityTab].map((activity, idx) => (
              <motion.div
                key={`${activity.type}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md group ${
                  getActivityColor(activity.type) === 'blue' ? 'border-blue-200 hover:border-blue-300' :
                  getActivityColor(activity.type) === 'green' ? 'border-green-200 hover:border-green-300' :
                  getActivityColor(activity.type) === 'red' ? 'border-red-200 hover:border-red-300' :
                  'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`p-3 rounded-lg group-hover:scale-110 transition-transform ${
                  getActivityColor(activity.type) === 'blue' ? 'bg-blue-100 text-blue-600' :
                  getActivityColor(activity.type) === 'green' ? 'bg-green-100 text-green-600' :
                  getActivityColor(activity.type) === 'red' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <p className="text-gray-900 font-medium truncate">
                      {activity.type === 'candidature' && `Candidature à ${activity.annonce__titre}`}
                      {activity.type === 'commentaire' && `Commentaire sur ${activity.annonce__titre}`}
                      {activity.type === 'reaction' && `Réaction ${activity.type} sur ${activity.annonce__titre}`}
                    </p>
                    
                    {activity.type === 'candidature' && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.statut)}`}>
                        {activity.statut}
                      </span>
                    )}
                  </div>
                  
                  {activity.type === 'commentaire' && (
                    <p className="text-gray-600 text-sm line-clamp-1">"{activity.contenu}"</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-1">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      getActivityColor(activity.type) === 'blue' ? 'bg-blue-50 text-blue-700' :
                      getActivityColor(activity.type) === 'green' ? 'bg-green-50 text-green-700' :
                      getActivityColor(activity.type) === 'red' ? 'bg-red-50 text-red-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(activity.date_candidature || activity.date_creation).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}