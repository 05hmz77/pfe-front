import React from 'react';
import { Paper, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnnoncesStats = ({ data }) => {
  const chartData = [
    { name: 'Évènements', value: data.events },
    { name: 'Dons', value: data.dons },
    { name: 'Bénévolat', value: data.benevolat },
  ];

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Annonces
      </Typography>
      <Typography variant="h4">{data.total}</Typography>
      <Typography variant="body2" color="text.secondary">
        (+{data.new_last_week} cette semaine)
      </Typography>

      <Divider sx={{ my: 2 }} />

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default AnnoncesStats;