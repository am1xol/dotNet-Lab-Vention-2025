// src/components/Subscriptions/DashboardHeader.tsx

import React from 'react';
import { Typography } from '@mui/material';
import { motion } from 'framer-motion';

export const DashboardHeader: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Typography
        variant="h2"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '2.5rem', md: '3.5rem' },
          background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          textAlign: 'center',
          mb: 2,
        }}
      >
        Subscription Dashboard
      </Typography>
      <Typography
        variant="h5"
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          fontWeight: 400,
          lineHeight: 1.6,
        }}
      >
        Manage all your subscriptions in one beautiful interface
      </Typography>
    </motion.div>
  );
};