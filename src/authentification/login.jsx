import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/login.css';
import Loader from './Loader';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        username_email: credentials.username,
        password: credentials.password
      });

      if (response.status === 200) {
        const { access, refresh, user } = response.data;
        // Stocker les tokens et les infos utilisateur
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Notification de succès
        toast.success('Connexion réussie !');
        
        // Appeler la fonction de callback si fournie
        if (onLogin) {
          onLogin(user, access);
        }
        
        // Redirection basée sur le type d'utilisateur
        setTimeout(() => {
          if(user.type === "ADMIN"){
            navigate('/welcome/admin');
          } else if(user.type === "CITOYEN"){
            navigate("/welcome/citoyen");
          } else {
            navigate("/welcome/association");
          }
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Identifiants incorrects';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="nav-buttons">
        <button className="nav-button" onClick={() => navigate("/register")}>Inscription</button>
        <button className="nav-button" onClick={() => navigate("/")}>Accueil</button>
      </div>
      
      <div className="login-card">
        <h2>Connexion</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? <Loader size="small" /> : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;