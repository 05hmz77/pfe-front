import React, { useEffect, useState } from "react";
import axios from "axios";
import { Grid, Paper, Typography, Box, CircularProgress } from "@mui/material";
import UsersStats from "./graphe/UsersStats";
import AnnoncesStats from "./graphe/AnnoncesStats";
import CandidaturesStats from "./graphe/CandidaturesStats";
import RecentActivities from "./graphe/RecentActivities";
import CategoriesChart from "./graphe/CategoriesChart";
import CandidaturesParCategorie from "./graphe/CandidaturesParCategorie";
import MoyenneCandidatures from "./graphe/MoyenneCandidatures";
import AssociationsStats from "./graphe/AssociationsStats";
import CitoyensStats from "./graphe/CitoyensStats";
import AnnoncesParType from "./graphe/AnnoncesParType";
import "./style/Dashboard.css"

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dashboardRes] = await Promise.all([
          axios.get("http://localhost:8000/api/statistics/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8000/api/dashboard/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setStats({
          ...statsRes.data,
          recentActivities: dashboardRes.data,
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Paper>
    );
  }

  // Dans votre composant Dashboard, modifiez le retour comme ceci :
return (
  <Box sx={{ 
    p: 3,
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  }}>
    <Typography variant="h4" gutterBottom sx={{ 
      mb: 4,
      color: 'primary.main',
      fontWeight: 'bold',
      textAlign: 'center'
    }}>
      Tableau de bord administratif - Bonjour {currentUser.username}
    </Typography>

    <Grid container spacing={3}>
      {/* Cartes de statistiques */}
      {[
        <UsersStats data={stats.users} />,
        <AssociationsStats data={stats.associations} />,
        <CitoyensStats data={stats.citoyens} />,
        <AnnoncesStats data={stats.annonces} />
      ].map((component, index) => (
        <Grid item xs={12} md={6} lg={3} key={index}>
          <Paper sx={{
            p: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            boxShadow: 3,
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'scale(1.02)'
            }
          }}>
            {component}
          </Paper>
        </Grid>
      ))}

      {/* Graphiques principaux */}
      <Grid item xs={12} md={6}>
        <Paper sx={{
          p: 3,
          height: '400px',
          borderRadius: 3,
          boxShadow: 3
        }}>
          <CategoriesChart data={stats.categories} />
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{
          p: 3,
          height: '400px',
          borderRadius: 3,
          boxShadow: 3
        }}>
          <CandidaturesParCategorie data={stats.candidatures.by_category} />
        </Paper>
      </Grid>

      {/* Sections secondaires */}
      <Grid item xs={12} md={6}>
        <Paper sx={{
          p: 3,
          height: '100%',
          borderRadius: 3,
          boxShadow: 3
        }}>
          <MoyenneCandidatures moyenne={stats.annonces.moyenne_candidatures} />
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{
          p: 3,
          height: '100%',
          borderRadius: 3,
          boxShadow: 3
        }}>
          <AnnoncesParType data={stats.annonces.by_type} />
        </Paper>
      </Grid>

      {/* Activités récentes */}
      <Grid item xs={12}>
        <Paper sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: 3
        }}>
          <RecentActivities data={stats.recentActivities} />
        </Paper>
      </Grid>
    </Grid>
  </Box>
);
};

export default Dashboard;
