import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const UserList = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("accessToken");
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/users/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Filter out the current user
        setUsers(response.data.filter((user) => user.id !== currentUser.id));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser.id]);

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="user-list">
      <h2>Chat with:</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <Link to={`/chat/${user.id}`}>{user.username}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
