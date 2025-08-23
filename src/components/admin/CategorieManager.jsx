import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./style/CategorieManager.css"

function CategorieManager() {
  const [categories, setCategories] = useState([]);
  const [nom, setNom] = useState("");
  const [editingId, setEditingId] = useState(null);
  const apiUrl = "http://localhost:8000/api/categories/";
  const token = localStorage.getItem("accessToken");

  const axiosInstance = axios.create({
    baseURL: apiUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("");
      setCategories(res.data);
      toast.success("Catégories chargées avec succès");
    } catch (err) {
      console.error("Erreur lors du fetch des catégories :", err);
      toast.error("Erreur lors du chargement des catégories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`${editingId}/`, { nom });
        toast.success("Catégorie modifiée avec succès");
      } else {
        await axiosInstance.post("", { nom });
        toast.success("Catégorie ajoutée avec succès");
      }
      fetchCategories();
      setNom("");
      setEditingId(null);
    } catch (err) {
      console.error("Erreur lors de la soumission :", err);
      toast.error("Erreur lors de l'opération");
    }
  };

  const handleEdit = (categorie) => {
    setNom(categorie.nom);
    setEditingId(categorie.id);
    toast("Prêt à modifier la catégorie", {
      icon: "✏️",
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette catégorie ?")) {
      try {
        await axiosInstance.delete(`${id}/`);
        toast.success("Catégorie supprimée avec succès");
        fetchCategories();
      } catch (err) {
        console.error("Erreur suppression :", err);
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="categorie-manager-container">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#f8fafc",
            color: "#0f172a",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            padding: "16px",
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#f8fafc",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#f8fafc",
            },
          },
        }}
      />

      <h2 className="categorie-manager-title">
        🗂️ Gestion des Catégories
      </h2>

      <form onSubmit={handleSubmit} className="categorie-form">
        <input
          type="text"
          placeholder="Nom de la catégorie"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          className="categorie-input"
        />
        <div className="form-buttons">
          <button
            type="submit"
            className="submit-button"
          >
            {editingId ? "💾 Modifier" : "➕ Ajouter"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNom("");
                toast("Modification annulée", { icon: "⚠️" });
              }}
              className="cancel-button"
            >
              ❌ Annuler
            </button>
          )}
        </div>
      </form>

      <ul className="categories-list">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="categorie-item"
          >
            <span className="categorie-name">{cat.nom}</span>
            <div className="action-buttons">
              <button
                onClick={() => handleEdit(cat)}
                className="edit-button"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="delete-button"
              >
                🗑️ Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategorieManager;