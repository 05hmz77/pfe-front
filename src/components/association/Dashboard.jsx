import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { Megaphone, FileText, MessageCircle, ThumbsUp } from "lucide-react";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:8000";
const DASHBOARD_URL = `${API_BASE}/api/associations/me/dashboard/`;

// ---------- Helpers ----------
const fmtDate = (d) => {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(d));
  } catch {
    return d;
  }
};

const groupTimelineByDay = (timeline = []) => {
  const m = new Map();
  for (const item of timeline) {
    const day = new Date(item.date);
    if (isNaN(day)) continue;
    const key = day.toISOString().slice(0, 10);
    m.set(key, (m.get(key) || 0) + 1);
  }
  const today = new Date();
  const arr = [];
  for (let i = 13; i >= 0; i--) {
    const dd = new Date(today);
    dd.setDate(today.getDate() - i);
    const key = dd.toISOString().slice(0, 10);
    arr.push({ day: key.slice(5), events: m.get(key) || 0 });
  }
  return arr;
};

const COLORS = ["#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

// ---------- Composant principal ----------
export default function AssociationDashboard() {
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; }
  }, []);
  const token = localStorage.getItem("accessToken");

  const [data, setData] = useState(null);
  const [rangeDays, setRangeDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const didFetch = useRef(false);

  const fetchDashboard = async (days = 30) => {
    if (!token) {
      setErr("Vous n'êtes pas connecté.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${DASHBOARD_URL}?range_days=${days}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        mode: "cors",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || `Erreur ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setErr(e.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchDashboard(rangeDays);
  }, [rangeDays]);

  const pieCandidatures = useMemo(() =>
    (data?.candidatures_par_statut || []).map((r) => ({
      name: r.statut.replace("_", " "),
      value: r.n,
    })), [data]);

  const barReactions = useMemo(() =>
    (data?.reactions_par_type || []).map((r) => ({
      name: r.type,
      count: r.n,
    })), [data]);

  const donutCategories = useMemo(() =>
    (data?.dist_categories || []).map((c) => ({
      name: c.name || c.categorie__nom || "Sans catégorie",
      value: c.n,
    })), [data]);

  const activitySeries = useMemo(() => groupTimelineByDay(data?.timeline), [data]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="rounded-[22px] bg-red-50 border border-red-200 p-6 text-red-700 shadow-md">
          Token manquant. Veuillez vous connecter.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {data?.association?.nom || currentUser?.username || "Mon Association"}
            </h1>
            <p className="text-gray-500">
              Tableau de bord — période: {data?.range_days ?? rangeDays} jours
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
            </select>
            <button
              onClick={() => fetchDashboard(rangeDays)}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white font-medium shadow"
            >
              Actualiser
            </button>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 rounded-[22px] bg-white border border-gray-200 animate-pulse" />
            ))}
          </div>
        )}
        {!!err && !loading && (
          <div className="mb-6 rounded-[22px] bg-red-50 border border-red-200 p-4 text-red-700 shadow">
            {err}
          </div>
        )}

        {/* Content */}
        {data && !loading && (
          <>
            {/* KPIs */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <KpiCard title="Annonces totales" value={data.cards.annonces_total} />
              <KpiCard title="Annonces actives" value={data.cards.annonces_actives} />
              <KpiCard title="Annonces expirées" value={data.cards.annonces_expirees} />
              <KpiCard title="Candidatures" value={data.cards.candidatures_total} accent="blue" />
              <KpiCard title="Commentaires" value={data.cards.engagement_total_commentaires} accent="green" />
              <KpiCard title="Messages non lus" value={data.cards.messages_non_lus} accent="amber" />
            </div>

            {/* Activity sparkline */}
            <Panel title="Activité globale (14 jours)">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activitySeries}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="events" stroke="#2563EB" fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Charts */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
              <Panel title="Candidatures par statut">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieCandidatures}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={2}
                      >
                        {pieCandidatures.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Réactions par type">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barReactions} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count">
                        {barReactions.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            {/* Donut + Table */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
              <Panel title="Répartition par catégorie (annonces)">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutCategories}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={65}
                        paddingAngle={3}
                      >
                        {donutCategories.map((_, i) => (
                          <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Top annonces (sur période)">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 pr-3">Titre</th>
                        <th className="py-2 pr-3">Début</th>
                        <th className="py-2 pr-3">Fin</th>
                        <th className="py-2 pr-3">Candidatures</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(!data.top_annonces_30j || data.top_annonces_30j.length === 0) && (
                        <tr><td className="py-3 text-gray-500" colSpan={4}>Aucune donnée.</td></tr>
                      )}
                      {data.top_annonces_30j?.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="py-2 pr-3 font-medium text-gray-900">{a.titre}</td>
                          <td className="py-2 pr-3">{fmtDate(a.date_debut)}</td>
                          <td className="py-2 pr-3">{fmtDate(a.date_fin)}</td>
                          <td className="py-2 pr-3 font-semibold text-blue-700">{a.nb_cand}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>

            {/* Timeline + Messages + Top bénévoles */}
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
              <Panel title="Activité récente" className="xl:col-span-2">
                <ul className="relative border-l-2 border-blue-200 ml-3 space-y-6">
                  {(!data.timeline || data.timeline.length === 0) && (
                    <li className="text-gray-500">Aucune activité.</li>
                  )}
                  {data.timeline?.map((item, i) => (
                    <li key={i} className="ml-4">
                      <div className="absolute -left-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        {item.type === "ANNONCE" && <Megaphone size={14} />}
                        {item.type === "CANDIDATURE" && <FileText size={14} />}
                        {item.type === "COMMENTAIRE" && <MessageCircle size={14} />}
                        {item.type === "REACTION" && <ThumbsUp size={14} />}
                      </div>
                      <div className="bg-white border border-gray-200 rounded-[22px] shadow-sm p-4">
                        <div className="text-sm text-gray-800">
                          {item.type === "ANNONCE" && (
                            <>Nouvelle annonce : <b>{item.payload.titre}</b></>
                          )}
                          {item.type === "CANDIDATURE" && (
                            <><b>{item.payload.citoyen_username}</b> a candidaté à <b>{item.payload.annonce_titre}</b> — <i>{item.payload.statut}</i></>
                          )}
                          {item.type === "COMMENTAIRE" && (
                            <><b>{item.payload.auteur_username}</b> a commenté <b>{item.payload.annonce_titre}</b> : “{item.payload.contenu}”</>
                          )}
                          {item.type === "REACTION" && (
                            <><b>{item.payload.utilisateur_username}</b> a réagi ({item.payload.type}) sur <b>{item.payload.annonce_titre}</b></>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{fmtDate(item.date)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <div className="space-y-4">
                <Panel title="Derniers messages">
                  <ul className="space-y-3">
                    {(!data.dernier_messages || data.dernier_messages.length === 0) && (
                      <li className="text-gray-500">Aucun message.</li>
                    )}
                    {data.dernier_messages?.map((m) => (
                      <li key={m.id} className="p-3 rounded-[22px] bg-white border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-800">
                          <b>{m.sender_username}</b> → <b>{m.receiver_username}</b>
                        </div>
                        <div className="text-gray-700 text-sm mt-1 line-clamp-2">{m.contenu}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                          <span>{fmtDate(m.date_envoi)}</span>
                          {!m.is_read && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              non lu
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Panel title="Top bénévoles (période)">
                  <ul className="divide-y divide-gray-200">
                    {(!data.top_citoyens_30j || data.top_citoyens_30j.length === 0) && (
                      <li className="py-3 text-gray-500">Aucune donnée.</li>
                    )}
                    {data.top_citoyens_30j?.map((c) => (
                      <li key={c.citoyen_id} className="py-3 flex items-center justify-between">
                        <span className="text-gray-800">{c["citoyen__user__username"]}</span>
                        <span className="px-2 py-1 rounded-lg bg-gray-100 border border-gray-200">{c.nb}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- UI bits ----------
function KpiCard({ title, value, accent = "indigo" }) {
  const accents = {
    indigo: "from-indigo-50 to-white border-indigo-100",
    blue: "from-blue-50 to-white border-blue-100",
    green: "from-emerald-50 to-white border-emerald-100",
    amber: "from-amber-50 to-white border-amber-100",
  };
  return (
    <div className={`rounded-[22px] bg-gradient-to-b ${accents[accent] || accents.indigo} border p-4 shadow`}>
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-3xl font-extrabold mt-1 text-gray-900">{value ?? 0}</div>
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <div className={`rounded-[22px] bg-white border border-gray-200 p-6 shadow-md mb-6 ${className}`}>
      <h2 className="font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}
