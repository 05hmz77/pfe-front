import React from 'react';
import '../styles/HomePageAssociation.css';

const HomePageAssociation = () => {
  return (
    <div className="association-home-container">
      <div className="association-hero">
        <h1>Welcome, Green Earth Initiative</h1>
        <p>Connect with volunteers and make an impact in your community</p>
        <button className="cta-button">Post New Opportunity</button>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <i className="fas fa-bullhorn"></i>
          <h3>8</h3>
          <p>Active Opportunities</p>
        </div>
        <div className="stat-card">
          <i className="fas fa-users"></i>
          <h3>24</h3>
          <p>Volunteers</p>
        </div>
        <div className="stat-card">
          <i className="fas fa-hand-holding-heart"></i>
          <h3>156</h3>
          <p>Hours Contributed</p>
        </div>
        <div className="stat-card">
          <i className="fas fa-star"></i>
          <h3>4.8</h3>
          <p>Average Rating</p>
        </div>
      </div>

      <div className="recent-volunteers">
        <h2>Recent Volunteers</h2>
        <div className="volunteers-grid">
          {[1, 2, 3, 4].map((volunteer) => (
            <div key={volunteer} className="volunteer-card">
              <div className="volunteer-avatar">
                <i className="fas fa-user-circle"></i>
              </div>
              <h3>Volunteer Name</h3>
              <p className="volunteer-skills">Gardening, Teaching</p>
              <div className="volunteer-stats">
                <span><i className="fas fa-clock"></i> 15 hrs</span>
                <span><i className="fas fa-tasks"></i> 2 projects</span>
              </div>
              <button className="message-btn">Message</button>
            </div>
          ))}
        </div>
      </div>

      <div className="upcoming-events">
        <h2>Upcoming Events</h2>
        <div className="events-list">
          <div className="event-card">
            <div className="event-date">
              <span className="day">15</span>
              <span className="month">Jun</span>
            </div>
            <div className="event-details">
              <h3>Beach Cleanup</h3>
              <p><i className="fas fa-map-marker-alt"></i> Marseille Beach</p>
              <p><i className="fas fa-users"></i> 12 volunteers registered</p>
            </div>
            <button className="manage-btn">Manage</button>
          </div>
          <div className="event-card">
            <div className="event-date">
              <span className="day">20</span>
              <span className="month">Jun</span>
            </div>
            <div className="event-details">
              <h3>Community Garden</h3>
              <p><i className="fas fa-map-marker-alt"></i> Local Park</p>
              <p><i className="fas fa-users"></i> 8 volunteers registered</p>
            </div>
            <button className="manage-btn">Manage</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageAssociation;