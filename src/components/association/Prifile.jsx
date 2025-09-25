import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Twitter, Facebook, Instagram, Linkedin } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api";
const MEDIA_BASE = "http://127.0.0.1:8000/media/";

// === Helpers ===
function parseArray(data) {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || [];
  } catch {
    return [];
  }
}

function Stars({ note }) {
  const value = Math.round(note);
  return (
    <div className="flex items-center gap-1 text-xl">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < value ? "text-blue-400" : "text-gray-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

const ModernCard = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all ${className}`}
  >
    {children}
  </div>
);

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
    />
  </div>
);

const TextAreaField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      {...props}
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
    />
  </div>
);

// === Composant principal ===
export default function AssociationProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Stats
  const [totalCandidatures, setTotalCandidatures] = useState(0);
  const [tauxAccepte, setTauxAccepte] = useState(0);
  const [citoyensUniques, setCitoyensUniques] = useState(0);

  const token = localStorage.getItem("accessToken");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Charger profil
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/association/edit/`, { headers });
        let reseaux = { twitter: "", facebook: "", instagram: "", linkedin: "" };
        try {
          reseaux = data.reseaux_sociaux ? JSON.parse(data.reseaux_sociaux) : reseaux;
        } catch {}
        setProfile({
          ...data,
          reseaux_sociaux: reseaux,
          feedback: parseArray(data.feedback),
        });
      } catch {
        toast.error("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  // Charger stats candidatures
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/candidatures/mes/`, { headers });
        const total = data.length;
        const accepted = data.filter((c) => c.statut === "ACCEPTEE").length;
        const citoyens = new Set(data.map((c) => c.citoyen?.id)).size;

        setTotalCandidatures(total);
        setTauxAccepte(total > 0 ? Math.round((accepted / total) * 100) : 0);
        setCitoyensUniques(citoyens);
      } catch {
        toast.error("Erreur lors du chargement des stats");
      }
    })();
  }, []); // eslint-disable-line

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      reseaux_sociaux: { ...prev.reseaux_sociaux, [name]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("nom", profile.nom);
      fd.append("description", profile.description);
      fd.append("contact", profile.contact);
      fd.append("reseaux_sociaux", JSON.stringify(profile.reseaux_sociaux || {}));
      if (selectedFile) {
        fd.append("logo", selectedFile);
      }

      await axios.put(`${API_BASE}/association/edit/`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });

      toast.success("Profil mis à jour avec succès !");
      setEditMode(false);
      setSelectedFile(null);
      setPreview("");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Feedback stats
  const notes = (profile?.feedback || []).map((f) => parseFloat(f.note) || 0);
  const avgNote = notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;
  const feedbackCount = profile?.feedback?.length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-blue-400 text-lg animate-pulse">Chargement...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ModernCard className="p-8 text-center">
          <div className="text-6xl mb-4 text-blue-400">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Profil non trouvé</h2>
          <p className="text-gray-600">Impossible de charger votre profil</p>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <ToastContainer position="top-right" autoClose={3000} theme="light" />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Onglets */}
        <div className="flex justify-center">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm inline-flex">
            {["profile", "stats", "feedback"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 text-base font-medium transition-colors ${
                  activeTab === tab
                    ? "text-blue-500 border-b-2 border-blue-400"
                    : "text-gray-500 hover:text-blue-500"
                }`}
              >
                {tab === "profile" && "Profil"}
                {tab === "stats" && "Statistiques"}
                {tab === "feedback" && "Évaluations"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar logo + infos */}
          <ModernCard className="p-8 text-center lg:col-span-1">
            <div className="relative inline-block">
              <img
                src={
                  preview ||
                  (profile.logo ? `${MEDIA_BASE}${profile.logo}` : "/default-profile.jpg")
                }
                alt="Logo association"
                className="w-40 h-40 rounded-full border-4 border-white shadow-lg object-cover mx-auto"
              />
              {editMode && (
                <label className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow cursor-pointer transition">
                  📷
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <h2 className="mt-4 text-2xl font-bold text-gray-800">{profile.nom}</h2>
            <p className="text-gray-600 text-lg">{profile.contact}</p>

            {/* Note moyenne */}
            <div className="mt-4">
              <Stars note={avgNote} />
              <p className="text-gray-600 mt-1">
                {avgNote.toFixed(1)} / 5 ({feedbackCount} avis)
              </p>
            </div>

            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition"
              >
                Modifier le profil
              </button>
            ) : (
              <div className="space-y-3 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50"
                >
                  {isSubmitting ? "Enregistrement..." : "Sauvegarder"}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition"
                >
                  Annuler
                </button>
              </div>
            )}
          </ModernCard>

          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "profile" && (
              <ModernCard className="p-8">
                {!editMode ? (
                  <div className="space-y-6">
                    <Section title="À propos" content={profile.description} />
                    <SocialSection reseaux={profile.reseaux_sociaux} />
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField
                      label="Nom association"
                      name="nom"
                      value={profile.nom}
                      onChange={handleChange}
                    />
                    <TextAreaField
                      label="Description"
                      name="description"
                      value={profile.description}
                      onChange={handleChange}
                      rows={4}
                    />
                    <InputField
                      label="Contact"
                      name="contact"
                      value={profile.contact}
                      onChange={handleChange}
                    />
                    {/* Réseaux sociaux */}
                    {["twitter", "facebook", "instagram", "linkedin"].map((rs) => (
                      <InputField
                        key={rs}
                        label={rs.charAt(0).toUpperCase() + rs.slice(1)}
                        name={rs}
                        value={profile.reseaux_sociaux[rs]}
                        onChange={handleSocialChange}
                      />
                    ))}
                  </form>
                )}
              </ModernCard>
            )}

            {activeTab === "stats" && (
              <ModernCard className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">
                  Statistiques Association
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <StatCard title="Candidatures totales" value={totalCandidatures} />
                  <StatCard title="Taux acceptées" value={`${tauxAccepte}%`} />
                  <StatCard title="Citoyens uniques" value={citoyensUniques} />
                </div>
              </ModernCard>
            )}

            {activeTab === "feedback" && (
              <ModernCard className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Évaluations</h3>
                {profile.feedback?.length > 0 ? (
                  <div className="space-y-4">
                    {profile.feedback.map((f, i) => (
                      <FeedbackCard key={i} feedback={f} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Aucun feedback pour le moment.</p>
                )}
              </ModernCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// === Sous-composants ===
const Section = ({ title, content }) => (
  <div>
    <h4 className="text-lg font-medium text-gray-700 mb-2">{title}</h4>
    <p className="text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-4">
      {content || "Non renseigné"}
    </p>
  </div>
);

const SocialSection = ({ reseaux }) => (
  <div>
    <h4 className="text-lg font-medium text-gray-700 mb-2">Réseaux sociaux</h4>
    <div className="flex flex-wrap gap-3">
      {reseaux.twitter && (
        <a href={reseaux.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sky-600 hover:underline">
          <Twitter className="h-5 w-5" /> Twitter
        </a>
      )}
      {reseaux.facebook && (
        <a href={reseaux.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-700 hover:underline">
          <Facebook className="h-5 w-5" /> Facebook
        </a>
      )}
      {reseaux.instagram && (
        <a href={reseaux.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-pink-600 hover:underline">
          <Instagram className="h-5 w-5" /> Instagram
        </a>
      )}
      {reseaux.linkedin && (
        <a href={reseaux.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline">
          <Linkedin className="h-5 w-5" /> LinkedIn
        </a>
      )}
      {!reseaux.twitter && !reseaux.facebook && !reseaux.instagram && !reseaux.linkedin && (
        <p className="text-gray-500">Aucun réseau social renseigné</p>
      )}
    </div>
  </div>
);

const StatCard = ({ title, value }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm hover:shadow-md hover:border-blue-400 transition">
    <div className="text-2xl font-bold text-blue-500">{value}</div>
    <div className="text-sm text-gray-600">{title}</div>
  </div>
);

const FeedbackCard = ({ feedback }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
    <p className="text-gray-700">{feedback.contenu}</p>
    <div className="flex items-center gap-2">
      <Stars note={parseFloat(feedback.note) || 0} />
      <span className="text-sm font-semibold text-blue-500">
        {parseFloat(feedback.note).toFixed(1)}
      </span>
    </div>
  </div>
);
