import React from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Person as PersonIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

const RecentActivities = ({ data }) => {
  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Activités récentes
      </Typography>

      <List>
        <Typography variant="subtitle2" sx={{ pl: 2, pt: 1 }}>
          Nouveaux utilisateurs
        </Typography>
        {data.recent_users?.map((user, index) => (
          <React.Fragment key={user.id}>
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={user.username}
                secondary={`Inscrit le ${new Date(
                  user.date_joined
                ).toLocaleDateString()}`}
              />
            </ListItem>
            {index < data.recent_users.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}

        <Typography variant="subtitle2" sx={{ pl: 2, pt: 2 }}>
          Nouvelles annonces
        </Typography>
        {data.recent_annonces?.map((annonce, index) => (
          <React.Fragment key={annonce.id}>
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  <EventIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={annonce.titre}
                secondary={`Créée le ${new Date(
                  annonce.date_creation
                ).toLocaleDateString()}`}
              />
            </ListItem>
            {index < data.recent_annonces.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}

        <Typography variant="subtitle2" sx={{ pl: 2, pt: 2 }}>
          Nouvelles candidatures
        </Typography>
        {data.recent_candidatures?.map((candidature, index) => (
          <React.Fragment key={candidature.id}>
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  <AssignmentIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`Candidature #${candidature.id}`}
                secondary={`Soumis le ${new Date(
                  candidature.date_candidature
                ).toLocaleDateString()}`}
              />
            </ListItem>
            {index < data.recent_candidatures.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default RecentActivities;
