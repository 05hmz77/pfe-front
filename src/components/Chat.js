import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import UserList from "./UserList";

import Login from "../authentification/login";

function AppC() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

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
        localStorage.removeItem("accessToken");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    if (socket) {
      socket.close();
    }
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
      <div className="sidebar">
        <UserList currentUser={currentUser} />
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      <div className="main-content">
        <Routes>
          <Route
            path="/:userId"
            element={
              <ChatWrapper currentUser={currentUser} setSocket={setSocket} />
            }
          />
          <Route path="/" element={<div>Select a user to chat with</div>} />
        </Routes>
      </div>
    </div>
  );
}

// Wrapper component to handle WebSocket connection
function ChatWrapper({ currentUser, setSocket }) {
  const { userId } = useParams();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const wsProtocol =
      window.location.protocol === "https:" ? "wss://" : "ws://";
    const socketUrl = `${wsProtocol}127.0.0.1:8000/ws/chat/${currentUser.id}/${userId}/`;

    const newSocket = new WebSocket(socketUrl);

    newSocket.onopen = () => {
      console.log("WebSocket connected");
      // Send authentication token after connection opens
      newSocket.send(
        JSON.stringify({
          type: "authentication",
          token: token,
        })
      );
    };

    newSocket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentUser.id, userId]);

  
}

export default AppC;
