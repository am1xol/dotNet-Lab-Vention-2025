import React from 'react';
import { Typography, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { StatsSection } from './StatsSection';

export const UnauthenticatedHero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Typography
          variant="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '3rem', md: '5rem', lg: '6rem' },
            background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mb: 2,
            lineHeight: 1.1,
          }}
        >
          Take Control of
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '3rem', md: '5rem', lg: '6rem' },
            color: '#5E35B1',
            mb: 4,
            lineHeight: 1.1,
          }}
        >
          Your Subscriptions
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Typography
          variant="h5"
          sx={{
            color: 'text.secondary',
            maxWidth: '700px',
            mb: 4,
            fontWeight: 400,
            lineHeight: 1.6,
          }}
        >
          Stop subscription chaos. Track, manage, and optimize all your recurring payments from one beautiful, secure dashboard. Save money and never miss a payment again.
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/auth?form=signup')}
            sx={{
              py: 2.5,
              px: 6,
              fontSize: '1.1rem',
              background:
                'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              color: 'white',
              borderRadius: 3,
              fontWeight: 600,
              boxShadow: '0 8px 32px rgba(126, 87, 194, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(126, 87, 194, 0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Get Started Free
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/auth?form=signin')}
            sx={{
              py: 2.5,
              px: 6,
              fontSize: '1.1rem',
              borderColor: '#7E57C2',
              color: '#7E57C2',
              borderRadius: 3,
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#5E35B1',
                background: 'rgba(126, 87, 194, 0.04)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Sign In
          </Button>
        </Stack>
      </motion.div>
      
      <StatsSection />
    </>
  );
};