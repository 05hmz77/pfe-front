import React, { useState } from 'react';
import axios from 'axios';
import '../styles/register.css'; // OK si le chemin est correct


const Inscription = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    type: '',
    nom: '',
    prenom: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Première étape : inscription de base
      const response = await axios.post('http://127.0.0.1:8000/api/signup/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        type: formData.type
      });

      if (response.status === 201) {
        const { access } = response.data;

        // Deuxième étape : selon le type d'utilisateur
        if (formData.type === 'CITOYEN') {
          await axios.post('http://127.0.0.1:8000/api/signup/citoyen/', {
            nom: formData.nom,
            prenom: formData.prenom
          }, {
            headers: {
              'Authorization': `Bearer ${access}`
            }
          });
        } else if (formData.type === 'ASSOCIATION') {
          await axios.post('http://127.0.0.1:8000/api/signup/association/', {
            nom: formData.nom
          }, {
            headers: {
              'Authorization': `Bearer ${access}`
            }
          });
        }

        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inscription-container">
      <h2>Inscription</h2>
      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          Inscription réussie! Vous pouvez maintenant vous connecter.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom d'utilisateur</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Mot de passe</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Type de compte</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionnez un type</option>
            <option value="CITOYEN">Citoyen</option>
            <option value="ASSOCIATION">Association</option>
          </select>
        </div>

        {formData.type === 'CITOYEN' && (
          <>
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        {formData.type === 'ASSOCIATION' && (
          <div className="form-group">
            <label>Nom de l'association</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'En cours...' : 'S\'inscrire'}
        </button>
      </form>
    </div>
  );
};

export default Inscription;