import React from 'react';
import { Paper, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const UsersStats = ({ data }) => {
  const pieData = [
    { name: 'Admins', value: data.admins },
    { name: 'Associations', value: data.associations },
    { name: 'Citoyens', value: data.citoyens },
  ];

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Utilisateurs
      </Typography>
      <Typography variant="h4">{data.total}</Typography>
      <Typography variant="body2" color="text.secondary">
        (+{data.new_last_week} cette semaine)
      </Typography>

      <Divider sx={{ my: 2 }} />

      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            paddingAngle={5}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <List dense>
        <ListItem>
          <ListItemText primary="Administrateurs" secondary={data.admins} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Associations" secondary={data.associations} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Citoyens" secondary={data.citoyens} />
        </ListItem>
      </List>
    </Paper>
  );
};

export default UsersStats;