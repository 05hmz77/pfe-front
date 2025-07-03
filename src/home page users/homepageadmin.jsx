import React from 'react';
import '../styles/HomePageAdmin.css';

const HomePageAdmin = () => {
  return (
    <div className="admin-home-container">
      <div className="admin-hero">
        <h1>Administration Panel</h1>
        <p>Manage platform users, content, and settings</p>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <div className="action-card">
            <i className="fas fa-users-cog"></i>
            <h3>User Management</h3>
            <p>View and manage all user accounts</p>
            <button>Go to Users</button>
          </div>
          <div className="action-card">
            <i className="fas fa-clipboard-check"></i>
            <h3>Moderate Content</h3>
            <p>Review reported content</p>
            <button>Check Reports</button>
          </div>
          <div className="action-card">
            <i className="fas fa-chart-line"></i>
            <h3>View Analytics</h3>
            <p>Platform usage statistics</p>
            <button>See Analytics</button>
          </div>
          <div className="action-card">
            <i className="fas fa-cog"></i>
            <h3>Platform Settings</h3>
            <p>Configure system parameters</p>
            <button>Settings</button>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-user-plus"></i>
            </div>
            <div className="activity-content">
              <p>5 new users registered today</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-flag"></i>
            </div>
            <div className="activity-content">
              <p>3 new content reports</p>
              <span className="activity-time">5 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <i className="fas fa-hand-holding-heart"></i>
            </div>
            <div className="activity-content">
              <p>12 new opportunities posted</p>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageAdmin;