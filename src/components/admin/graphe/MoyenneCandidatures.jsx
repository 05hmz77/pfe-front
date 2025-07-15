import React from 'react';
import { Paper, Typography } from '@mui/material'; // Import ajouté ici

const MoyenneCandidatures = ({ moyenne }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Moyenne candidatures par annonce
      </Typography>
      <Typography variant="h3" align="center">
        {moyenne}
      </Typography>
    </Paper>
  );
};

export default MoyenneCandidatures;