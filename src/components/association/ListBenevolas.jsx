import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ListBenevoles = () => {
  const navigate = useNavigate();
  const [benevoles, setBenevoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedBenevole, setSelectedBenevole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState("");
  const [contenu, setContenu] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // état d’extension des missions par bénévole: { [id]: boolean }
  const [expanded, setExpanded] = useState({});

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchBenevolesAcceptes = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await axios.get(
          "http://127.0.0.1:8000/api/candidatures/mes/",
          { headers }
        );

        const candidaturesAcceptees = data.filter(
          (c) => c.statut === "ACCEPTEE"
        );

        const benevolesUniques = {};
        candidaturesAcceptees.forEach((candidature) => {
          const citoyenId = candidature.citoyen;
          const details = candidature.citoyen_details;
          if (!details) return;

          if (!benevolesUniques[citoyenId]) {
            benevolesUniques[citoyenId] = {
              ...details,
              id: citoyenId,
              user_id: details.user,
              candidatures: [candidature],
            };
          } else {
            benevolesUniques[citoyenId].candidatures.push(candidature);
          }
        });

        setBenevoles(Object.values(benevolesUniques));
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Erreur lors du chargement des bénévoles."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBenevolesAcceptes();
  }, [token]);

  const firstPhotoUrl = (album_photos) => {
    try {
      const arr = album_photos ? JSON.parse(album_photos) : [];
      if (Array.isArray(arr) && arr.length > 0) {
        return `http://127.0.0.1:8000/${arr[0]}`;
      }
    } catch {}
    return "/profile.jpg";
  };

  const showEvaluationModal = (benevole) => {
    setSelectedBenevole(benevole);
    setNote("");
    setContenu("");
    setFeedbackMessage(null);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const envoyerMsg = (benevole) => {
    navigate("/welcome/association/chat", { state: { user: benevole } });
  };

  const handleSendFeedback = async () => {
    if (!note || !contenu) {
      setFeedbackMessage("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `http://localhost:8000/api/feedback/${selectedBenevole.user_id}/`,
        { note, contenu },
        { headers }
      );
      setFeedbackMessage("Évaluation envoyée avec succès !");
      setBenevoles((prev) =>
        prev.map((b) =>
          b.id === selectedBenevole.id ? { ...b, note_engagement: note } : b
        )
      );
    } catch (error) {
      setFeedbackMessage(
        error?.response?.data?.detail ||
          "Erreur lors de l'envoi de l'évaluation."
      );
    }
  };

  const toggleMissions = (id) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold">
          👥 Vos Bénévoles Acceptés
        </h1>
        <p className="text-gray-600">
          Voici les bénévoles qui ont rejoint vos missions
        </p>
      </header>

      {/* Empty state */}
      {benevoles.length === 0 ? (
        <div className="border rounded-2xl bg-white shadow-sm p-10 text-center">
          <div className="mx-auto h-16 w-16 grid place-items-center rounded-2xl bg-gray-100 border">
            📭
          </div>
          <p className="mt-4 text-gray-700">
            Aucun bénévole accepté pour le moment.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benevoles.map((benevole) => {
            const missionsCount = benevole.candidatures?.length || 0;
            const isOpen = !!expanded[benevole.id];

            return (
              <article
                key={benevole.id}
                className="bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-4 flex items-center gap-3 border-b">
                  <img
                    src={firstPhotoUrl(benevole.album_photos)}
                    onError={(e) => (e.currentTarget.src = "/profile.jpg")}
                    className="h-12 w-12 rounded-full object-cover border"
                    alt={`${benevole.nom} ${benevole.prenom}`}
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">
                      {benevole.nom} {benevole.prenom}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 mt-1">
                      Accepté
                    </span>
                  </div>
                </div>

                {/* Infos */}
                <div className="p-4 space-y-2 text-sm text-gray-700">
                  <p className="line-clamp-3">
                    <span className="font-medium">Bio : </span>
                    {benevole.bio || "Aucune bio disponible"}
                  </p>
                  <p className="line-clamp-3">
                    <span className="font-medium">Expérience : </span>
                    {benevole.experiences || "Non spécifiée"}
                  </p>

                  {/* Toggle Missions */}
                  <div className="mt-3">
                    <button
                      onClick={() => toggleMissions(benevole.id)}
                      className="w-full inline-flex items-center justify-between rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                      aria-expanded={isOpen}
                      aria-controls={`missions-${benevole.id}`}
                    >
                      <span className="font-semibold text-gray-900">
                        Missions acceptées
                      </span>
                      <span className="text-gray-600 text-xs">
                        {isOpen ? "Masquer" : "Afficher"} ({missionsCount})
                      </span>
                    </button>

                    {/* Liste masquée par défaut */}
                    {isOpen && (
                      <div
                        id={`missions-${benevole.id}`}
                        className="mt-2 space-y-2"
                      >
                        {missionsCount === 0 ? (
                          <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                            Aucune mission.
                          </div>
                        ) : (
                          <ul className="space-y-2">
                            {benevole.candidatures.map((candidature) => (
                              <li
                                key={candidature.id}
                                className="rounded-xl border bg-gray-50 px-3 py-2"
                              >
                                <p className="truncate">
                                  <span className="font-medium">Message :</span>{" "}
                                  {candidature.message}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  <span className="font-medium">Date :</span>{" "}
                                  {new Date(
                                    candidature.date_candidature
                                  ).toLocaleDateString("fr-FR")}
                                </p>
                                {candidature.note_engagement && (
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Note :</span>{" "}
                                    {candidature.note_engagement}/10
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto p-4 border-t flex items-center justify-between gap-2">
                  <button
                    onClick={() => showEvaluationModal(benevole)}
                    className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Évaluer
                  </button>
                  <button
                    onClick={() => envoyerMsg(benevole)}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
                  >
                    Envoyer message
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Modal d'évaluation */}
      {showModal && selectedBenevole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={closeModal}
          />
          <div className="relative w-[95%] max-w-lg bg-white rounded-2xl border shadow-2xl overflow-hidden">
            {/* Close */}
            <button
              className="absolute right-3 top-3 h-8 w-8 rounded-full grid place-items-center border hover:bg-gray-50"
              onClick={closeModal}
              aria-label="Fermer"
            >
              ×
            </button>

            {/* Header */}
            <div className="p-5 border-b flex items-center gap-3">
              <img
                src={firstPhotoUrl(selectedBenevole.album_photos)}
                onError={(e) => (e.currentTarget.src = "/profile.jpg")}
                alt={`${selectedBenevole.nom} ${selectedBenevole.prenom}`}
                className="h-12 w-12 rounded-full object-cover border"
              />
              <h2 className="font-semibold">
                {selectedBenevole.nom} {selectedBenevole.prenom}
              </h2>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3 text-sm text-gray-700">
              <p>
                <span className="font-medium">Bio :</span>{" "}
                {selectedBenevole.bio || "Non disponible"}
              </p>
              <p>
                <span className="font-medium">Expérience :</span>{" "}
                {selectedBenevole.experiences || "Non disponible"}
              </p>

              <hr className="my-2" />

              <h3 className="font-semibold text-gray-900">Évaluer ce bénévole</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Note sur 10</label>
                  <input
                    type="number"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    min="1"
                    max="10"
                    className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Commentaire</label>
                  <textarea
                    value={contenu}
                    onChange={(e) => setContenu(e.target.value)}
                    rows={4}
                    placeholder="Votre évaluation..."
                    className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {feedbackMessage && (
                  <p
                    className={`text-sm ${
                      feedbackMessage.includes("succès")
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {feedbackMessage}
                  </p>
                )}

                <button
                  onClick={handleSendFeedback}
                  className="w-full rounded-xl bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
                >
                  Envoyer l'évaluation
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-end">
              <button
                className="rounded-xl border px-4 py-2 hover:bg-gray-100"
                onClick={closeModal}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListBenevoles;
