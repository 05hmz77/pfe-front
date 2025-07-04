import React from 'react';
import '../styles/HomePageCitoyen.css';

const HomePageCitoyen = () => {
  const recommendedOpportunities = [
    {
      id: 1,
      title: 'Beach Cleanup',
      organization: 'Green Earth',
      date: 'June 15, 2023',
      location: 'Marseille Beach',
      skills: ['Environment', 'Teamwork'],
      image: '/beach-cleanup.jpg'
    },
    {
      id: 2,
      title: 'Reading Buddy',
      organization: 'Literacy Foundation',
      date: 'June 20, 2023',
      location: 'Local Library',
      skills: ['Teaching', 'Communication'],
      image: '/reading-buddy.jpg'
    },
    {
      id: 3,
      title: 'Food Bank Volunteer',
      organization: 'Community Aid',
      date: 'June 25, 2023',
      location: 'Downtown Center',
      skills: ['Organization', 'Teamwork'],
      image: '/food-bank.jpg'
    }
  ];

  return (
    <div className="citoyen-home-container">
      <div className="citoyen-hero">
        <div className="hero-text">
          <h1>Make a Difference in Your Community</h1>
          <p>Find volunteer opportunities that match your skills and interests</p>
          <button className="cta-button">Browse Opportunities</button>
        </div>
        <div className="hero-image">
          <img src="/citoyen-hero.jpg" alt="Volunteer" />
        </div>
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <i className="fas fa-clock"></i>
          <div>
            <h3>42</h3>
            <p>Hours Volunteered</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-award"></i>
          <div>
            <h3>5</h3>
            <p>Projects Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-users"></i>
          <div>
            <h3>12</h3>
            <p>Connections Made</p>
          </div>
        </div>
      </div>

      <div className="recommended-section">
        <h2>Recommended For You</h2>
        <div className="opportunities-grid">
          {recommendedOpportunities.map((opp) => (
            <div key={opp.id} className="opportunity-card">
              <div className="opportunity-image" style={{ backgroundImage: `url(${opp.image})` }}></div>
              <div className="opportunity-content">
                <h3>{opp.title}</h3>
                <p className="organization">{opp.organization}</p>
                <div className="opportunity-meta">
                  <p><i className="fas fa-calendar-alt"></i> {opp.date}</p>
                  <p><i className="fas fa-map-marker-alt"></i> {opp.location}</p>
                </div>
                <div className="skills">
                  {opp.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
                <button className="interest-btn">I'm Interested</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="upcoming-events">
        <h2>Your Upcoming Events</h2>
        <div className="events-list">
          <div className="event-card">
            <div className="event-date">
              <span className="day">15</span>
              <span className="month">Jun</span>
            </div>
            <div className="event-details">
              <h3>Beach Cleanup</h3>
              <p><i className="fas fa-map-marker-alt"></i> Marseille Beach</p>
              <p><i className="fas fa-clock"></i> 9:00 AM - 12:00 PM</p>
            </div>
            <button className="details-btn">Details</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageCitoyen;