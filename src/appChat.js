import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import UserList from "./components/UserList";
import Chat from "./components/Chat";
import "./App.css";
import Login from "./authentification/login";

function AppC() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/users/current/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCurrentUser(response.data);
      } catch (error) {
        console.error("Error fetching current user:", error);
        setError("Failed to load user data");
        // Optionally clear invalid token
        localStorage.removeItem("accessToken");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setCurrentUser(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="app-container">
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br>
       </br>
       <br>
       </br>
       <br>
       </br>
      <div className="sidebar">
        <UserList currentUser={currentUser} />
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      <div className="main-content">
        <Routes>
          <Route path="/:userId" element={<Chat currentUser={currentUser} />} />
          <Route path="/" element={<div>Select a user to chat with</div>} />
        </Routes>
      </div>
    </div>
  );
}

export default AppC;
