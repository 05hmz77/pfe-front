import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style/profile.css";
import { red } from "@mui/material/colors";
import { Feed } from "@mui/icons-material";

const AssociationProfile = () => {
  const [profile, setProfile] = useState({
    nom: "",
    description: "",
    contact: "",
    logo: "",
    reseaux_sociaux: {
      twitter: "",
      facebook: "",
      instagram: "",
      linkedin: "",
    },
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
      const response = await axios.get(
        "http://127.0.0.1:8000/api/association/edit/",
        { headers }
      );

      const data = response.data;
      setProfile({
        nom: data.nom || "",
        description: data.description || "",
        contact: data.contact || "",
        logo: data.logo || "",
        reseaux_sociaux: data.reseaux_sociaux
          ? JSON.parse(data.reseaux_sociaux)
          : {
              twitter: "",
              facebook: "",
              instagram: "",
              linkedin: "",
            },
      });
      console.log(data);
      let feedback = JSON.parse(data.feedback) || [];
      setFeedback(feedback);
      let count = 0;
      console.log(typeof feedback[0].note);
      feedback.map((i) => {
        count += parseInt(i.note);
      });

      if (count / feedback.length != 0) {
       
        setNote(count / feedback.length);
      }

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
    const file = e.target.files[0];
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
      formData.append(
        "reseaux_sociaux",
        JSON.stringify(profile.reseaux_sociaux)
      );

      if (selectedFile) {
        formData.append("logo", selectedFile);
      } else if (profile.logo) {
        formData.append("logo", profile.logo);
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
    if (profile.logo) return `http://localhost:8000/media/${profile.logo}`;
    return "/profile.jpg";
  };

  if (loading) {
    return (
      <div className="modern-loading">
        <div className="modern-spinner"></div>
      </div>
    );
  }

  return (
    <div className="modern-profile-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="modern-header">
        <h1>Mon Profil Association</h1>
        {!editMode && (
          <button className="modern-edit-btn" onClick={() => setEditMode(true)}>
            <i className="fas fa-pencil-alt"></i> Éditer
          </button>
        )}
      </div>

      <div className="modern-profile-card">
        <div className="modern-logo-section">
          <div className="modern-logo-container">
            <img
              src={getLogoUrl()}
              alt="Logo de l'association"
              className="modern-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/profile.jpg";
              }}
            />
            {editMode && (
              <div className="modern-logo-upload">
                <label
                  htmlFor="modern-logo-upload"
                  className="modern-upload-btn"
                >
                  <i className="fas fa-cloud-upload-alt"></i> Changer
                </label>
                <input
                  id="modern-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        </div>

        {!editMode ? (
          <div className="modern-view-mode">
            <div className="modern-info-group">
              <h2 className="modern-association-name">{profile.nom}</h2>
              <div className="modern-info-item">
                <i className="fas fa-info-circle"></i>
                <span>about Association : </span>
                <p>{profile.description || "Aucune description disponible"}</p>
              </div>
              <div className="modern-info-item">
                <i className="fas fa-envelope"></i>
                <span>contact : </span>
                <p>{profile.contact || "Non renseigné"}</p>
              </div>
            </div>

            <div className="modern-social-section">
              <h3>Réseaux sociaux</h3>
              <div className="modern-social-grid">
                {profile.reseaux_sociaux.twitter && (
                  <a
                    href={profile.reseaux_sociaux.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modern-social-link twitter"
                  >
                    <i className="fab fa-twitter"></i>
                    <span>Twitter</span>
                  </a>
                )}
                {profile.reseaux_sociaux.facebook && (
                  <a
                    href={profile.reseaux_sociaux.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modern-social-link facebook"
                  >
                    <i className="fab fa-facebook-f"></i>
                    <span>Facebook</span>
                  </a>
                )}
                {profile.reseaux_sociaux.instagram && (
                  <a
                    href={profile.reseaux_sociaux.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modern-social-link instagram"
                  >
                    <i className="fab fa-instagram"></i>
                    <span>Instagram</span>
                  </a>
                )}
                {profile.reseaux_sociaux.linkedin && (
                  <a
                    href={profile.reseaux_sociaux.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modern-social-link linkedin"
                  >
                    <i className="fab fa-linkedin-in"></i>
                    <span>LinkedIn</span>
                  </a>
                )}
                {!profile.reseaux_sociaux.twitter &&
                  !profile.reseaux_sociaux.facebook &&
                  !profile.reseaux_sociaux.instagram &&
                  !profile.reseaux_sociaux.linkedin && (
                    <p className="modern-no-social">
                      Aucun réseau social configuré
                    </p>
                  )}
              </div>

              <div>
                <div className="note">
                  <label htmlFor="">note evaluation </label>
                  <span>{note}</span>
                </div>
                <div className="list-feedback">
                  <label htmlFor="">list feedback </label>
                  {feedback.map((i) => (
                    <div>
                      <label htmlFor="">feedback:</label>
                      <span>{i.contenu}  </span>

                      <label htmlFor="">     note</label>
                      <span>{i.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modern-edit-form">
            <div className="modern-form-group">
              <label>Nom de l'association</label>
              <input
                type="text"
                name="nom"
                value={profile.nom}
                onChange={handleChange}
                required
                className="modern-form-input"
              />
            </div>

            <div className="modern-form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={profile.description}
                onChange={handleChange}
                rows="4"
                className="modern-form-textarea"
              />
            </div>

            <div className="modern-form-group">
              <label>Contact</label>
              <input
                type="text"
                name="contact"
                value={profile.contact}
                onChange={handleChange}
                className="modern-form-input"
                placeholder="Email ou téléphone"
              />
            </div>

            <div className="modern-social-edit">
              <h3>Réseaux sociaux</h3>

              <div className="modern-form-group">
                <div className="modern-input-with-icon">
                  <i className="fab fa-twitter"></i>
                  <input
                    type="url"
                    name="twitter"
                    value={profile.reseaux_sociaux.twitter}
                    onChange={handleSocialMediaChange}
                    placeholder="https://twitter.com/votrepseudo"
                    className="modern-form-input"
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <div className="modern-input-with-icon">
                  <i className="fab fa-facebook-f"></i>
                  <input
                    type="url"
                    name="facebook"
                    value={profile.reseaux_sociaux.facebook}
                    onChange={handleSocialMediaChange}
                    placeholder="https://facebook.com/votrepage"
                    className="modern-form-input"
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <div className="modern-input-with-icon">
                  <i className="fab fa-instagram"></i>
                  <input
                    type="url"
                    name="instagram"
                    value={profile.reseaux_sociaux.instagram}
                    onChange={handleSocialMediaChange}
                    placeholder="https://instagram.com/votrepseudo"
                    className="modern-form-input"
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <div className="modern-input-with-icon">
                  <i className="fab fa-linkedin-in"></i>
                  <input
                    type="url"
                    name="linkedin"
                    value={profile.reseaux_sociaux.linkedin}
                    onChange={handleSocialMediaChange}
                    placeholder="https://linkedin.com/company/votresociete"
                    className="modern-form-input"
                  />
                </div>
              </div>
            </div>

            <div className="modern-form-actions">
              <button type="submit" className="modern-save-btn">
                Enregistrer les modifications
              </button>
              <button
                type="button"
                className="modern-cancel-btn"
                onClick={() => {
                  setEditMode(false);
                  setSelectedFile(null);
                  setPreviewLogo("");
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AssociationProfile;
