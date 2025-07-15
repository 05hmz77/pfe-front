import React from "react";
import {
  Paper,
  Typography,
  Divider,
  Stack,
  LinearProgress,
} from "@mui/material";

const CandidaturesStats = ({ data }) => {
  const total = data.total || 1;
  const acceptedPercentage = (data.accepted / total) * 100;
  const pendingPercentage = (data.pending / total) * 100;
  const refusedPercentage = (data.refused / total) * 100;

  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Candidatures
      </Typography>
      <Typography variant="h4">{data.total}</Typography>
      <Typography variant="body2" color="text.secondary">
        (+{data.new_last_week} cette semaine)
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        <div>
          <Typography variant="body2">Acceptées ({data.accepted})</Typography>
          <LinearProgress
            variant="determinate"
            value={acceptedPercentage}
            color="success"
            sx={{ height: 10 }}
          />
        </div>
        <div>
          <Typography variant="body2">En attente ({data.pending})</Typography>
          <LinearProgress
            variant="determinate"
            value={pendingPercentage}
            color="warning"
            sx={{ height: 10 }}
          />
        </div>
        <div>
          <Typography variant="body2">Refusées ({data.refused})</Typography>
          <LinearProgress
            variant="determinate"
            value={refusedPercentage}
            color="error"
            sx={{ height: 10 }}
          />
        </div>
      </Stack>
    </Paper>
  );
};

export default CandidaturesStats;
