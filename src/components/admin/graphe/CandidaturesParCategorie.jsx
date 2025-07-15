import React from 'react';
import { Paper, Typography } from '@mui/material'; // Import ajouté ici
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CandidaturesParCategorie = ({ data }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Candidatures par catégorie
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="total_candidatures" fill="#8884d8" name="Total candidatures" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default CandidaturesParCategorie;