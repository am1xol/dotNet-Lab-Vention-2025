import React from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Card,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth-store';
import Header from './Header';
import FloatingIcons from './FloatingServiceIcons';

const LandingPage: React.FC = () => {
  useAuthStore();

  const features = [
    { 
      title: 'Centralized Management', 
      description: 'Manage all your subscriptions in one convenient dashboard' 
    },
    { 
      title: 'Cost Tracking', 
      description: 'Monitor your spending and optimize your subscription budget' 
    },
    { 
      title: 'Renewal Alerts', 
      description: 'Get notified before payments and never miss a renewal' 
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FloatingIcons />
      
      <Header />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack
          spacing={6}
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: '80vh', textAlign: 'center', py: 8 }}
        >
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
                mb: 2,
              }}
            >
              Subscription
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                color: '#5E35B1',
                mb: 4,
              }}
            >
              Management Made Simple
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                maxWidth: '600px',
                mb: 6,
                fontWeight: 400,
                lineHeight: 1.6,
                fontSize: '1.2rem',
              }}
            >
              Take control of your digital subscriptions. Track, manage, and optimize 
              all your recurring payments from one beautiful interface.
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ width: '100%' }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { 
                  xs: '1fr', 
                  md: 'repeat(3, 1fr)'
                },
                gap: 4,
                maxWidth: '1000px',
                margin: '0 auto',
                alignItems: 'stretch',
              }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                >
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
                      background: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: 3,
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 16px 40px rgba(126, 87, 194, 0.15)',
                      },
                    }}
                  >
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#7E57C2', 
                        mb: 2, 
                        fontWeight: 600,
                        fontSize: '1.3rem',
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'text.secondary',
                        lineHeight: 1.6,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  );
};

export default LandingPage;