import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./style/profile.css";

const CitoyenProfile = () => {
  const [profile, setProfile] = useState({
    nom: '',
    prenom: '',
    bio: '',
    experiences: '',
    album_photos: [],
    feedback: []
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const currentUser = JSON.parse(localStorage.getItem("user") || '{}');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://127.0.0.1:8000/api/citoyen/edit/', { headers });
      
      const formattedData = {
        ...response.data,
        album_photos: Array.isArray(response.data.album_photos) 
          ? response.data.album_photos 
          : JSON.parse(response.data.album_photos || '[]'),
        feedback: JSON.parse(response.data.feedback || '[]')
      };
      
      setProfile(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('nom', profile.nom);
      formData.append('prenom', profile.prenom);
      formData.append('bio', profile.bio);
      formData.append('experiences', profile.experiences);
      formData.append('feedback', JSON.stringify(profile.feedback));
      
      if (selectedFile) {
        formData.append('album_photos', selectedFile);
      } else if (profile.album_photos.length > 0) {
        formData.append('album_photos', JSON.stringify(profile.album_photos));
      }
      
      const token = localStorage.getItem("accessToken");
      await axios.put('http://127.0.0.1:8000/api/citoyen/edit/', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Profile updated successfully');
      setEditMode(false);
      setSelectedFile(null);
      setPreviewImage('');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const getProfilePhoto = () => {
    if (previewImage) return previewImage;
    if (profile.album_photos.length > 0) {
      const photo = profile.album_photos[0];
      return typeof photo === 'object' 
        ? `http://localhost:8000/media/${photo.image}`
        : `http://localhost:8000/media/${photo}`;
    }
    return `${process.env.PUBLIC_URL}/default-profile.jpg`;
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="profile-header">
        <h1>My Citizen Profile</h1>
        {!editMode && (
          <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
            <i className="fas fa-edit"></i> Edit Profile
          </button>
        )}
      </div>
      
      <div className="profile-card">
        <div className="profile-photo-section">
          <div className="avatar-container">
            <img 
              src={getProfilePhoto()} 
              alt="Profile" 
              className="profile-avatar"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = `${process.env.PUBLIC_URL}/profile.jpg`;
              }}
            />
            {editMode && (
              <label className="avatar-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <span className="upload-icon"><i className="fas fa-camera"></i></span>
              </label>
            )}
          </div>
          
          <div className="user-basic-info">
            <h2>{currentUser.username}</h2>
            <p className="user-email">{currentUser.email}</p>
            {!editMode && profile.nom && profile.prenom && (
              <p className="user-fullname">{profile.prenom} {profile.nom}</p>
            )}
          </div>
        </div>
        
        {!editMode ? (
          <div className="profile-details">
            <div className="detail-section">
              <h3>About Me</h3>
              <p className="bio">{profile.bio || 'No bio provided'}</p>
            </div>
            
            <div className="detail-section">
              <h3>Experiences</h3>
              <p className="experiences">{profile.experiences || 'No experiences listed'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="prenom"
                  value={profile.prenom}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="nom"
                  value={profile.nom}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
              />
            </div>
            
            <div className="form-group">
              <label>Experiences</label>
              <textarea
                name="experiences"
                value={profile.experiences}
                onChange={handleChange}
                placeholder="Share your experiences..."
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="save-btn">Save Changes</button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setEditMode(false);
                  setSelectedFile(null);
                  setPreviewImage('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CitoyenProfile;