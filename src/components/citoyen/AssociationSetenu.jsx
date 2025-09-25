import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api";
const MEDIA_BASE = "http://127.0.0.1:8000/media/";

export default function AssociationSoutenue() {
  const navigate = useNavigate();
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Feedback
  const [selectedAssociation, setSelectedAssociation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState("");
  const [contenu, setContenu] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const token = localStorage.getItem("accessToken");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // Charger associations soutenues
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [candidaturesRes, annoncesRes] = await Promise.all([
          axios.get(`${API_BASE}/candidatures/mes/`, { headers }),
          axios.get(`${API_BASE}/annonces/`, { headers }),
        ]);

        const accepted = candidaturesRes.data.filter(
          (c) => c.statut === "ACCEPTEE"
        );

        const supported = accepted
          .map((c) => {
            const annonce = annoncesRes.data.find((a) => a.id === c.annonce);
            return annonce?.association;
          })
          .filter(Boolean)
          .reduce((unique, item) => {
            return unique.some((u) => u.id === item.id) ? unique : [...unique, item];
          }, []);

        setAssociations(supported);
      } catch {
        setError("Impossible de charger vos associations.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Feedback
  const handleSendFeedback = async () => {
    if (!note || !contenu) {
      setFeedbackMessage("Veuillez remplir tous les champs.");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_BASE}/feedback/${selectedAssociation.user}/`,
        { note, contenu },
        { headers }
      );
      setFeedbackMessage("Feedback envoyé avec succès !");
      setNote("");
      setContenu("");
    } catch (error) {
      if (error.response?.status === 400) {
        setFeedbackMessage("Vous avez déjà évalué cette association.");
      } else {
        setFeedbackMessage("Erreur lors de l'envoi du feedback.");
      }
    }
  };

  const navigateToChat = (association) => {
    navigate("/welcome/citoyen/chat", { state: { user: association } });
  };

  const showAssociationDetails = (association) => {
    setSelectedAssociation(association);
    setShowModal(true);
    setNote("");
    setContenu("");
    setFeedbackMessage(null);
  };

  const closeModal = () => setShowModal(false);

  // Loading & Error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-medium">
        {error}
      </div>
    );
  }

  // Page principale
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <header className="max-w-5xl mx-auto mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Associations soutenues</h1>
        <p className="text-gray-600 mt-2">
          Retrouvez ici toutes les associations que vous soutenez activement.
        </p>
      </header>

      {associations.length === 0 ? (
        <div className="text-center text-gray-600 py-16">
          <p>Aucune association soutenue pour l’instant.</p>
          <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
            Découvrir des associations
          </button>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {associations.map((asso) => (
            <div
              key={asso.id}
              className="bg-white rounded-xl shadow hover:shadow-md transition p-6 flex flex-col"
            >
              <img
                src={`${MEDIA_BASE}${asso.logo}`}
                alt={asso.nom}
                className="w-20 h-20 object-cover rounded-full border mx-auto"
                onError={(e) => (e.currentTarget.src = "/profile.jpg")}
              />
              <h3 className="mt-4 text-lg font-semibold text-gray-800 text-center">
                {asso.nom}
              </h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3 text-center">
                {asso.description || "Pas de description."}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => navigateToChat(asso)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
                >
                  Discuter 💬
                </button>
                <button
                  onClick={() => showAssociationDetails(asso)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg"
                >
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedAssociation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b flex items-center gap-4">
              <img
                src={`${MEDIA_BASE}${selectedAssociation.logo}`}
                alt="Logo association"
                className="w-20 h-20 rounded-full border shadow"
                onError={(e) => (e.currentTarget.src = "/profile.jpg")}
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedAssociation.nom}</h2>
                <p className="text-sm text-gray-500">Association partenaire</p>
              </div>
            </div>

            {/* Infos détaillées */}
            <div className="p-6 grid gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600">
                  {selectedAssociation.description || "Non disponible"}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Coordonnées</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    {selectedAssociation.contact || "Non disponible"}
                  </p>
                  {selectedAssociation.site_web && (
                    <p className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-600" />
                      <a
                        href={selectedAssociation.site_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedAssociation.site_web}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {selectedAssociation.reseaux_sociaux && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Réseaux sociaux</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(JSON.parse(selectedAssociation.reseaux_sociaux)).map(
                      ([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm"
                        >
                          {platform === "facebook" && (
                            <Facebook className="h-4 w-4 text-blue-600" />
                          )}
                          {platform === "instagram" && (
                            <Instagram className="h-4 w-4 text-pink-600" />
                          )}
                          {platform === "twitter" && (
                            <Twitter className="h-4 w-4 text-sky-500" />
                          )}
                          {platform === "linkedin" && (
                            <Linkedin className="h-4 w-4 text-blue-700" />
                          )}
                          {platform}
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Votre avis</h3>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2 border rounded-lg mb-3"
                  placeholder="Note sur 10"
                />
                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  rows="4"
                  placeholder="Votre commentaire..."
                  className="w-full p-2 border rounded-lg"
                />
                {feedbackMessage && (
                  <p className="text-sm mt-2 text-center text-blue-600 font-medium">
                    {feedbackMessage}
                  </p>
                )}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSendFeedback}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                  >
                    Envoyer
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
