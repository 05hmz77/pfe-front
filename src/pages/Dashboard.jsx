import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css'; // OK si le chemin est correct

const Dashboard = () => {
  const [userType, setUserType] = useState('citoyen'); // Change to 'association' or 'admin' to see different views
  const navigate = useNavigate();

  // Static user data
  const userData = {
    citoyen: {
      username: 'JeanDupont',
      email: 'jean.dupont@email.com',
      profile: {
        prenom: 'Jean',
        nom: 'Dupont',
        photo: '/citoyen-avatar.jpg',
        bio: 'Passionate about community service and environmental protection',
        skills: ['Gardening', 'Teaching', 'Construction']
      }
    },
    association: {
      username: 'GreenEarth',
      email: 'contact@greenearth.org',
      profile: {
        nom: 'Green Earth Initiative',
        logo: '/association-logo.png',
        description: 'Dedicated to environmental conservation and sustainability',
        contact: 'contact@greenearth.org'
      }
    },
    admin: {
      username: 'AdminSolidar',
      email: 'admin@solidarlink.org',
      profile: {
        role: 'Platform Administrator',
        since: '2022-01-15'
      }
    }
  };

  // Static data for all views
  const staticData = {
    stats: {
      citoyen: {
        hours: 42,
        projects: 5,
        connections: 12,
        badges: 3
      },
      association: {
        opportunities: 8,
        volunteers: 24,
        hours: 156,
        rating: 4.8
      },
      admin: {
        users: 1245,
        opportunities: 356,
        reports: 3,
        growth: 15.7
      }
    },
    activities: [
      {
        icon: 'calendar-check',
        title: 'Upcoming Event',
        description: 'Beach cleanup scheduled for Saturday',
        timestamp: '2023-06-15T09:00:00'
      },
      {
        icon: 'thumbs-up',
        title: 'New Connection',
        description: 'Connected with Green Earth Initiative',
        timestamp: '2023-06-14T14:30:00'
      },
      {
        icon: 'certificate',
        title: 'Badge Earned',
        description: 'Received "Eco Warrior" badge',
        timestamp: '2023-06-12T11:15:00'
      }
    ],
    opportunities: [
      {
        id: 1,
        title: 'Community Garden Volunteer',
        image: '/garden-opportunity.jpg',
        description: 'Help maintain our urban garden and learn about sustainable agriculture',
        location: 'Paris 15e',
        date: '2023-06-20',
        status: 'Upcoming'
      },
      {
        id: 2,
        title: 'Reading Buddy Program',
        image: '/reading-opportunity.jpg',
        description: 'Support young readers at the local elementary school',
        location: 'Lyon',
        date: '2023-06-25',
        status: 'Recruiting'
      }
    ],
    volunteers: [
      {
        id: 1,
        prenom: 'Marie',
        nom: 'Leblanc',
        photo: '/volunteer1.jpg',
        skills: ['Teaching', 'Childcare', 'First Aid'],
        hours: 32,
        projects: 4
      },
      {
        id: 2,
        prenom: 'Pierre',
        nom: 'Martin',
        photo: '/volunteer2.jpg',
        skills: ['Construction', 'Carpentry', 'Teamwork'],
        hours: 45,
        projects: 6
      }
    ]
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const renderDashboard = () => {
    switch(userType) {
      case 'citoyen':
        return <CitizenDashboard user={userData.citoyen} data={staticData} />;
      case 'association':
        return <AssociationDashboard user={userData.association} data={staticData} />;
      case 'admin':
        return <AdminDashboard user={userData.admin} data={staticData} />;
      default:
        return <CitizenDashboard user={userData.citoyen} data={staticData} />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Glass Navbar */}
      <nav className="glass-navbar">
        <div className="navbar-brand">
          <img src="/logo.png" alt="SolidarLink Logo" className="logo" />
          <span>SolidarLink</span>
        </div>
        
        <div className="navbar-search">
          <input type="text" placeholder="Search opportunities..." />
          <button className="search-btn">
            <i className="fas fa-search"></i>
          </button>
        </div>
        
        <div className="navbar-links">
          <button className="nav-link active">
            <i className="fas fa-home"></i>
            <span>Home</span>
          </button>
          <button className="nav-link">
            <i className="fas fa-hand-holding-heart"></i>
            <span>Opportunities</span>
          </button>
          {userType === 'admin' && (
            <button className="nav-link">
              <i className="fas fa-cog"></i>
              <span>Admin</span>
            </button>
          )}
        </div>
        
        <div className="navbar-user">
          <div className="user-avatar">
            <img 
              src={userData[userType].profile.photo || userData[userType].profile.logo || '/default-avatar.png'} 
              alt="User" 
            />
          </div>
          <div className="user-dropdown">
            <span>{userData[userType].username}</span>
            <i className="fas fa-chevron-down"></i>
            <div className="dropdown-menu">
              <button onClick={() => navigate('/profile')}>
                <i className="fas fa-user"></i> Profile
              </button>
              <button onClick={() => setUserType('citoyen')}>
                <i className="fas fa-user"></i> View as Citizen
              </button>
              <button onClick={() => setUserType('association')}>
                <i className="fas fa-users"></i> View as Association
              </button>
              <button onClick={() => setUserType('admin')}>
                <i className="fas fa-cog"></i> View as Admin
              </button>
              <button onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        {renderDashboard()}
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/logo-white.png" alt="SolidarLink" />
            <p>Connecting hearts, creating change</p>
          </div>
          <div className="footer-links">
            <a href="#">About Us</a>
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-social">
            <i className="fab fa-facebook"></i>
            <i className="fab fa-twitter"></i>
            <i className="fab fa-instagram"></i>
            <i className="fab fa-linkedin"></i>
          </div>
        </div>
        <div className="footer-copyright">
          © {new Date().getFullYear()} SolidarLink. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

// Citizen Dashboard Component
const CitizenDashboard = ({ user, data }) => (
  <>
    {/* Hero Welcome Section */}
    <section className="hero-section">
      <div className="hero-text">
        <h1>Welcome, {user.profile.prenom}!</h1>
        <p>
          You've contributed to {data.opportunities.length} opportunities and made a real difference in your community.
        </p>
        <button className="cta-button">Browse New Opportunities</button>
      </div>
      <div className="hero-image">
        <img src="/citizen-hero.png" alt="Citizen Hero" />
      </div>
    </section>

    {/* Stats Overview */}
    <section className="stats-section">
      <div className="stat-card">
        <i className="fas fa-clock"></i>
        <h3>{data.stats.citoyen.hours}</h3>
        <p>Hours Volunteered</p>
      </div>
      <div className="stat-card">
        <i className="fas fa-award"></i>
        <h3>{data.stats.citoyen.projects}</h3>
        <p>Projects Completed</p>
      </div>
      <div className="stat-card">
        <i className="fas fa-users"></i>
        <h3>{data.stats.citoyen.connections}</h3>
        <p>Connections Made</p>
      </div>
      <div className="stat-card">
        <i className="fas fa-medal"></i>
        <h3>{data.stats.citoyen.badges}</h3>
        <p>Badges Earned</p>
      </div>
    </section>

    {/* Recent Activity */}
    <section className="activity-section">
      <h2>Your Recent Activity</h2>
      <div className="activity-grid">
        {data.activities.map((activity, index) => (
          <div key={index} className="activity-card">
            <div className="activity-icon">
              <i className={`fas fa-${activity.icon}`}></i>
            </div>
            <div className="activity-content">
              <h3>{activity.title}</h3>
              <p>{activity.description}</p>
              <span className="activity-time">
                {new Date(activity.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Recommended Opportunities */}
    <section className="recommendations-section">
      <h2>Recommended For You</h2>
      <div className="recommendations-grid">
        {data.opportunities.map((opp, index) => (
          <div key={index} className="recommendation-card">
            <img src={opp.image} alt={opp.title} />
            <h3>{opp.title}</h3>
            <p>{opp.description}</p>
            <div className="opportunity-meta">
              <span><i className="fas fa-map-marker-alt"></i> {opp.location}</span>
              <span><i className="fas fa-calendar-alt"></i> {opp.date}</span>
            </div>
            <button className="interest-btn">I'm Interested</button>
          </div>
        ))}
      </div>
    </section>
  </>
);

// Association Dashboard Component
const AssociationDashboard = ({ user, data }) => (
  <>
    {/* Hero Welcome Section */}
    <section className="hero-section">
      <div className="hero-text">
        <h1>Welcome, {user.profile.nom}!</h1>
        <p>
          You have {data.opportunities.length} active opportunities and {data.volunteers.length} potential volunteers.
        </p>
        <button className="cta-button">Create New Opportunity</button>
      </div>
      <div className="hero-image">
        <img src="/association-hero.png" alt="Association Hero" />
      </div>
    </section>

    {/* Stats Overview */}
    <section className="stats-section">
      <div className="stat-card">
        <i className="fas fa-bullhorn"></i>
        <h3>{data.stats.association.opportunities}</h3>
        <p>Active Opportunities</p>
      </div>
      <div className="stat-card">
        <i className="fas fa-users"></i>
        <h3>{data.stats.association.volunteers}</h3>
        <p>Total Volunteers</p>
      </div>
      <div className="stat-card">
        <i className="fas fa-hand-holding-heart"></i>
        <h3>{data.stats.association.hours}</h3>
        <p>Hours Contributed</p>
      </div>
      <div className="stat-card">
        <i className="fas fa-star"></i>
        <h3>{data.stats.association.rating}</h3>
        <p>Average Rating</p>
      </div>
    </section>

    {/* Recent Activity */}
    <section className="activity-section">
      <h2>Recent Activity</h2>
      <div className="activity-grid">
        {data.activities.map((activity, index) => (
          <div key={index} className="activity-card">
            <div className="activity-icon">
              <i className={`fas fa-${activity.icon}`}></i>
            </div>
            <div className="activity-content">
              <h3>{activity.title}</h3>
              <p>{activity.description}</p>
              <span className="activity-time">
                {new Date(activity.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Your Opportunities */}
    <section className="opportunities-section">
      <h2>Your Opportunities</h2>
      <div className="opportunities-grid">
        {data.opportunities.map((opp, index) => (
          <div key={index} className="opportunity-card">
            <h3>{opp.title}</h3>
            <p className="opportunity-status">{opp.status}</p>
            <p>{opp.description}</p>
            <div className="opportunity-meta">
              <span><i className="fas fa-user-friends"></i> 5 applicants</span>
              <span><i className="fas fa-calendar-alt"></i> {opp.date}</span>
            </div>
            <button className="manage-btn">Manage Opportunity</button>
          </div>
        ))}
      </div>
    </section>

    {/* Recommended Volunteers */}
    <section className="volunteers-section">
      <h2>Recommended Volunteers</h2>
      <div className="volunteers-grid">
        {data.volunteers.map((volunteer, index) => (
          <div key={index} className="volunteer-card">
            <img src={volunteer.photo} alt={`${volunteer.prenom} ${volunteer.nom}`} />
            <h3>{volunteer.prenom} {volunteer.nom}</h3>
            <p className="volunteer-skills">
              {volunteer.skills.join(', ')}
            </p>
            <div className="volunteer-stats">
              <span><i className="fas fa-clock"></i> {volunteer.hours} hrs</span>
              <span><i className="fas fa-tasks"></i> {volunteer.projects} projects</span>
            </div>
            <button className="view-btn">View Profile</button>
          </div>
        ))}
      </div>
    </section>
  </>
);

// Admin Dashboard Component
const AdminDashboard = ({ user, data }) => (
  <>
    {/* Hero Welcome Section */}
    <section className="hero-section">
      <div className="hero-text">
        <h1>Admin Dashboard</h1>
        <p>
          You're managing {data.stats.admin.users} users, {data.stats.admin.opportunities} opportunities, and have {data.stats.admin.reports} pending reports.
        </p>
      </div>
      <div className="hero-image">
        <img src="/admin-hero.png" alt="Admin Hero" />
      </div>
    </section>

    {/* Stats Overview */}
    <section className="stats-section">
      <div className="stat-card">
        <i className="fas fa-users"></i>
        <h3>{data.stats.admin.users}</h3>
        <p>Total Users</p>
      </div>
      <div className="stat-card">
        <i className="fas fa-hand-holding-heart"></i>
        <h3>{data.stats.admin.opportunities}</h3>
        <p>Opportunities</p>
      </div>
      <div className="stat-card">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>{data.stats.admin.reports}</h3>
        <p>Pending Reports</p>
      </div>
      <div className="stat-card">
        <i className="fas fa-chart-line"></i>
        <h3>{data.stats.admin.growth}%</h3>
        <p>Monthly Growth</p>
      </div>
    </section>

    {/* Recent Activity */}
    <section className="activity-section">
      <h2>Admin Activity Log</h2>
      <div className="activity-grid">
        {data.activities.map((activity, index) => (
          <div key={index} className="activity-card">
            <div className="activity-icon">
              <i className={`fas fa-${activity.icon}`}></i>
            </div>
            <div className="activity-content">
              <h3>{activity.title}</h3>
              <p>{activity.description}</p>
              <span className="activity-time">
                {new Date(activity.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Recent Users */}
    <section className="users-section">
      <h2>Recent Users</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Type</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>JeanDupont</td>
              <td>jean.dupont@email.com</td>
              <td>Citoyen</td>
              <td>2023-01-15</td>
              <td><span className="status-badge active">Active</span></td>
              <td>
                <button className="admin-action-btn view">View</button>
                <button className="admin-action-btn edit">Edit</button>
              </td>
            </tr>
            <tr>
              <td>GreenEarth</td>
              <td>contact@greenearth.org</td>
              <td>Association</td>
              <td>2022-11-20</td>
              <td><span className="status-badge active">Active</span></td>
              <td>
                <button className="admin-action-btn view">View</button>
                <button className="admin-action-btn edit">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </>
);

export default Dashboard;