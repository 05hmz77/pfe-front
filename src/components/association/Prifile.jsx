import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Pencil,
  UploadCloud,
  Info,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  User2,
  Star,
} from "lucide-react";

const AssociationProfile = () => {
  const [profile, setProfile] = useState({
    nom: "",
    description: "",
    contact: "",
    logo: "",
    reseaux_sociaux: { twitter: "", facebook: "", instagram: "", linkedin: "" },
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [note, setNote] = useState(0);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.get(
        "http://127.0.0.1:8000/api/association/edit/",
        { headers }
      );

      let reseaux = { twitter: "", facebook: "", instagram: "", linkedin: "" };
      try {
        reseaux = data.reseaux_sociaux ? JSON.parse(data.reseaux_sociaux) : reseaux;
      } catch {}

      let fbs = [];
      try {
        fbs = data.feedback ? JSON.parse(data.feedback) : [];
      } catch {}
      const sum = fbs.reduce((acc, it) => acc + (parseInt(it.note) || 0), 0);
      const avg = fbs.length ? sum / fbs.length : 0;

      setProfile({
        nom: data.nom || "",
        description: data.description || "",
        contact: data.contact || "",
        logo: data.logo || "",
        reseaux_sociaux: reseaux,
      });
      setFeedback(fbs);
      setNote(Number.isFinite(avg) ? Number(avg.toFixed(1)) : 0);
      setLoading(false);
      toast.success("Profil chargé avec succès");
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialMediaChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      reseaux_sociaux: { ...prev.reseaux_sociaux, [name]: value },
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.match("image.*")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewLogo(reader.result);
      reader.readAsDataURL(file);
    } else {
      toast.warning("Veuillez sélectionner une image valide");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("nom", profile.nom);
      formData.append("description", profile.description);
      formData.append("contact", profile.contact);
      formData.append("reseaux_sociaux", JSON.stringify(profile.reseaux_sociaux));
      if (selectedFile) {
        formData.append("logo", selectedFile);
      } else if (profile.logo) {
        formData.append("logo", profile.logo); // supprime cette ligne si l’API refuse une string
      }

      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      await axios.put("http://127.0.0.1:8000/api/association/edit/", formData, {
        headers,
      });

      toast.success("Profil mis à jour avec succès");
      setEditMode(false);
      setSelectedFile(null);
      setPreviewLogo("");
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    }
  };

  const getLogoUrl = () => {
    if (previewLogo) return previewLogo;
    if (profile.logo) return `http://127.0.0.1:8000/media/${profile.logo}`;
    return "/profile.jpg";
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] grid place-items-center">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  const SocialLink = ({ href, label, Icon, color }) => {
    if (!href) return null;
    const base =
      "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:shadow-sm hover:bg-gray-50 transition";
    const tint =
      color === "tw"
        ? "text-sky-600 border-sky-200"
        : color === "fb"
        ? "text-blue-700 border-blue-200"
        : color === "ig"
        ? "text-pink-600 border-pink-200"
        : color === "li"
        ? "text-blue-600 border-blue-200"
        : "text-gray-700 border-gray-200";
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${base} ${tint}`}>
        <Icon className="h-4 w-4" />
        <span className="truncate max-w-[180px]">{label}</span>
      </a>
    );
  };

  return (
    <div className="min-h-[80vh] flex flex-col">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Contenu centré et limité en largeur */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold">Mon Profil Association</h1>
          {!editMode && (
            <button
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-gray-50"
              onClick={() => setEditMode(true)}
              title="Éditer"
            >
              <Pencil className="h-4 w-4" />
              Éditer
            </button>
          )}
        </div>

        {/* Carte profil qui s’étire pour occuper l’espace (flex-1) */}
        <div className="flex-1 mt-4 bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Top: Logo + infos */}
          <div className="p-5 flex flex-col sm:flex-row gap-5">
            {/* Logo */}
            <div className="shrink-0">
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border bg-white overflow-hidden grid place-items-center">
                <img
                  src={getLogoUrl()}
                  alt="Logo de l'association"
                  className="object-cover h-full w-full"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/profile.jpg";
                  }}
                />
                {editMode && (
                  <label className="absolute bottom-1 left-1 right-1 inline-flex items-center justify-center gap-2 rounded-xl border bg-white/90 backdrop-blur px-2 py-1 text-xs cursor-pointer hover:bg-white">
                    <UploadCloud className="h-4 w-4" />
                    Changer
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              {!editMode ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-semibold truncate">
                    {profile.nom || "—"}
                  </h2>

                  <div className="mt-2 grid gap-2 text-sm text-gray-700">
                    <div className="inline-flex items-center gap-2">
                      <Info className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">À propos :</span>
                      <span className="line-clamp-2">
                        {profile.description || "Aucune description disponible"}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Contact :</span>
                      <span>{profile.contact || "Non renseigné"}</span>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="mt-3 inline-flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const filled = i + 1 <= Math.round(note);
                        return (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              filled
                                ? "fill-yellow-400 stroke-yellow-400"
                                : "stroke-yellow-400"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-sm text-gray-700">{note}/5</span>
                    <span className="text-xs text-gray-500">
                      ({feedback.length} avis)
                    </span>
                  </div>
                </>
              ) : (
                <div className="grid gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Nom de l'association</label>
                    <input
                      type="text"
                      name="nom"
                      value={profile.nom}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Description</label>
                    <textarea
                      name="description"
                      value={profile.description}
                      onChange={handleChange}
                      rows="3"
                      className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Contact</label>
                    <input
                      type="text"
                      name="contact"
                      value={profile.contact}
                      onChange={handleChange}
                      placeholder="Email ou téléphone"
                      className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section basse (grille) */}
          <div className="border-t p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Réseaux sociaux */}
            <div className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-gray-800">Réseaux sociaux</h3>

              {!editMode ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <SocialLink
                    href={profile.reseaux_sociaux.twitter}
                    label="Twitter"
                    Icon={Twitter}
                    color="tw"
                  />
                  <SocialLink
                    href={profile.reseaux_sociaux.facebook}
                    label="Facebook"
                    Icon={Facebook}
                    color="fb"
                  />
                  <SocialLink
                    href={profile.reseaux_sociaux.instagram}
                    label="Instagram"
                    Icon={Instagram}
                    color="ig"
                  />
                  <SocialLink
                    href={profile.reseaux_sociaux.linkedin}
                    label="LinkedIn"
                    Icon={Linkedin}
                    color="li"
                  />
                  {!profile.reseaux_sociaux.twitter &&
                    !profile.reseaux_sociaux.facebook &&
                    !profile.reseaux_sociaux.instagram &&
                    !profile.reseaux_sociaux.linkedin && (
                      <p className="text-sm text-gray-500">Aucun réseau social configuré</p>
                    )}
                </div>
              ) : (
                <div className="mt-3 grid gap-3">
                  <div>
                    <label className="text-sm text-gray-600 inline-flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-sky-600" /> Twitter
                    </label>
                    <input
                      type="url"
                      name="twitter"
                      value={profile.reseaux_sociaux.twitter}
                      onChange={handleSocialMediaChange}
                      placeholder="https://twitter.com/votrepseudo"
                      className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 inline-flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-700" /> Facebook
                    </label>
                    <input
                      type="url"
                      name="facebook"
                      value={profile.reseaux_sociaux.facebook}
                      onChange={handleSocialMediaChange}
                      placeholder="https://facebook.com/votrepage"
                      className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 inline-flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" /> Instagram
                    </label>
                    <input
                      type="url"
                      name="instagram"
                      value={profile.reseaux_sociaux.instagram}
                      onChange={handleSocialMediaChange}
                      placeholder="https://instagram.com/votrepseudo"
                      className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 inline-flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-600" /> LinkedIn
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={profile.reseaux_sociaux.linkedin}
                      onChange={handleSocialMediaChange}
                      placeholder="https://linkedin.com/company/votresociete"
                      className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Feedbacks */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-800">Avis & retours</h3>
              {feedback.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">Aucun avis pour le moment.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {feedback.map((f, idx) => (
                    <li
                      key={idx}
                      className="rounded-xl border p-3 bg-gray-50/60 flex items-start gap-3"
                    >
                      <div className="h-9 w-9 rounded-full bg-gray-200 grid place-items-center shrink-0">
                        <User2 className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">Utilisateur</span>
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 stroke-yellow-400" />
                            {f.note}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5 break-words">
                          {f.contenu || "—"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Actions (en bas de la carte) */}
          {editMode && (
            <form onSubmit={handleSubmit} className="mt-auto border-t p-5 bg-gray-50/50">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setEditMode(false);
                    setSelectedFile(null);
                    setPreviewLogo("");
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssociationProfile;
