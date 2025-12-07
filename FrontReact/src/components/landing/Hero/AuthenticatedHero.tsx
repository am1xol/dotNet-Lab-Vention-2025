import React from 'react';
import { Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../store/auth-store';
import { useNavigate } from 'react-router-dom';

export const AuthenticatedHero: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Typography
        variant="h1"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '3rem', md: '4.5rem' },
          background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          mb: 2,
        }}
      >
        Welcome back!
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          color: '#7E57C2',
          mb: 3,
        }}
      >
        {user?.firstName} {user?.lastName}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          color: 'text.secondary',
          maxWidth: '600px',
          mb: 4,
          fontWeight: 400,
          lineHeight: 1.6,
        }}
      >
        Ready to continue managing your subscriptions?
      </Typography>

      <Button
        variant="contained"
        size="large"
        onClick={() => navigate('/dashboard')}
        sx={{
          py: 2.5,
          px: 6,
          fontSize: '1.2rem',
          background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
          borderRadius: 3,
          color: 'white',
          fontWeight: 600,
          boxShadow: '0 8px 32px rgba(126, 87, 194, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(126, 87, 194, 0.4)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        Go to Dashboard
      </Button>
    </motion.div>
  );
};