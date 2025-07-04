import axios from 'axios';
import React, { useEffect, useState } from 'react';

const Statistics = () => {
  const [listeassociations, setlisteassociations] = useState([])
  const [listeuser, setlisteuser] = useState([])

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/association-with-users/")
      .then((res) => {
        if (res.status === 200) {
          setlisteassociations(res.data)
        }
      }).catch((error) => {
        console.log(error)
      })
  }, [])
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/list-user/")
      .then((res) => {
        if (res.status === 200) {
          setlisteuser(res.data)
        }
      }).catch((error) => {
        console.log(error)
      })
  }, [])
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Statistiques de la plateforme</h1>
      <p style={styles.subtitle}>Vue d'ensemble des performances et de l'activité</p>
      
      {/* Top Stats Cards */}
      <div style={styles.statsContainer}>
        <StatCard 
          title="Utilisateurs actifs" 
          value={listeuser.length} 
          change="ce mois-ci" 
        />
        <StatCard 
          title="Associations validées" 
          value={listeassociations.filter((a)=>a.user.is_active === true).length} 
          change="ce mois-ci" 
        />
        <StatCard 
          title="Annonces publiées" 
          value="342" 
          change="+28 ce mois-ci" 
        />
        <StatCard 
          title="Candidatures traitées" 
          value="892" 
          change="+67 ce mois-ci" 
        />
      </div>
      
      <div style={styles.divider} />
      
      {/* Monthly Activity */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Activité mensuelle</h2>
        <StatsTable
          data={[
            { label: "Nouvelles inscriptions", value: "45", change: "+12%" },
            { label: "Annonces publiées", value: "28", change: "+8%" },
            { label: "Candidatures envoyées", value: "156", change: "+23%" },
            { label: "Missions terminées", value: "89", change: "+15%" }
          ]}
        />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, change }) => (
  <div style={styles.statCard}>
    <div style={styles.statTitle}>{title}</div>
    <div style={styles.statValue}>{value}</div>
    <div style={styles.statChange}>{change}</div>
  </div>
);

// Stats Table Component
const StatsTable = ({ data }) => (
  <table style={styles.table}>
    <tbody>
      {data.map((row, index) => (
        <tr key={index}>
          <td style={styles.tableLabel}>{row.label}</td>
          <td style={styles.tableValue}>{row.value}</td>
          <td style={{...styles.tableChange, color: '#27ae60'}}>{row.change}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Top Associations Table Component
const TopAssociationsTable = ({ data }) => (
  <table style={styles.table}>
    <thead>
      <tr>
        <th style={styles.tableHeader}>Nom</th>
        <th style={styles.tableHeader}>Annonces</th>
        <th style={styles.tableHeader}>Bénévoles</th>
        <th style={styles.tableHeader}>Note</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row, index) => (
        <tr key={index}>
          <td style={row.highlight ? {...styles.tableCell, fontWeight: 'bold'} : styles.tableCell}>
            {row.name}
          </td>
          <td style={styles.tableCell}>{row.announcements}</td>
          <td style={styles.tableCell}>{row.volunteers}</td>
          <td style={styles.tableCell}>{row.rating}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Styles
const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#f5f7fa',
    color: '#333',
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  title: {
    color: '#2c3e50',
    fontSize: '24px',
    marginBottom: '5px',
  },
  subtitle: {
    color: '#7f8c8d',
    fontSize: '14px',
    marginTop: '0',
    marginBottom: '30px',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  statTitle: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '10px 0 5px 0',
  },
  statChange: {
    fontSize: '14px',
    color: '#27ae60',
  },
  divider: {
    border: '0',
    height: '1px',
    backgroundColor: '#ecf0f1',
    margin: '40px 0',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    color: '#2c3e50',
    fontSize: '18px',
    marginBottom: '15px',
  },
  sectionSubtitle: {
    color: '#7f8c8d',
    fontSize: '14px',
    marginTop: '-10px',
    marginBottom: '15px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  tableHeader: {
    padding: '15px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    color: '#7f8c8d',
    fontWeight: 'normal',
    fontSize: '14px',
  },
  tableLabel: {
    padding: '15px',
    textAlign: 'left',
    borderBottom: '1px solid #ecf0f1',
    width: '50%',
  },
  tableValue: {
    padding: '15px',
    textAlign: 'left',
    borderBottom: '1px solid #ecf0f1',
  },
  tableChange: {
    padding: '15px',
    textAlign: 'right',
    borderBottom: '1px solid #ecf0f1',
  },
  tableCell: {
    padding: '15px',
    textAlign: 'left',
    borderBottom: '1px solid #ecf0f1',
  },
};

export default Statistics;