'use client';

import { Box, Paper, Typography, Grid } from '@mui/material';
import { WavingHand as WaveIcon } from '@mui/icons-material';

interface WelcomeCardProps {
  user: {
    name?: string;
    email?: string;
  } | null;
}

export default function WelcomeCard({ user }: WelcomeCardProps) {
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  
  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good afternoon';
  } else if (currentHour >= 17) {
    greeting = 'Good evening';
  }

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <Paper
      sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white',
        p: 4,
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      />

      <Grid container alignItems="center" spacing={2}>
        <Grid item>
          <WaveIcon sx={{ fontSize: 40, color: '#FFF59D' }} />
        </Grid>
        <Grid item xs>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {greeting}, {firstName}!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Welcome back to your Investment Platform. Here's what's happening with your portfolios today.
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}