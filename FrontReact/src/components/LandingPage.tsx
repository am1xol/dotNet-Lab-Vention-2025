import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Stack, 
  Card, 
  Button, 
  Grid,
  Avatar,
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  Dashboard, 
  Analytics, 
  Payment,
  Category,
} from '@mui/icons-material';
import { useAuthStore } from '../store/auth-store';
import Header from './Header';
import FloatingIcons from './FloatingServiceIcons';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const features = [
    {
      icon: Dashboard,
      title: 'Centralized Dashboard',
      description: 'Manage all your subscriptions from one beautiful, intuitive interface',
      color: '#7E57C2'
    },
    {
      icon: Analytics,
      title: 'Smart Analytics',
      description: 'Track spending patterns and get insights to optimize your subscription budget',
      color: '#4CAF50'
    },
    {
      icon: Payment,
      title: 'Payment Tracking',
      description: 'Monitor all transactions and payment history in one secure location',
      color: '#2196F3'
    },
    {
      icon: Category,
      title: 'Organized Categories',
      description: 'Categorize subscriptions for better organization and insights',
      color: '#9C27B0'
    }
  ];

  const stats = [
    { value: '50+', label: 'Subscription Types' },
    { value: '1K+', label: 'Active Users' },
    { value: '99%', label: 'Satisfaction Rate' }
  ];

  const steps = [
    {
      step: 1,
      title: 'Sign Up',
      description: 'Create your account in seconds'
    },
    {
      step: 2,
      title: 'Add Subscriptions',
      description: 'Import or manually add your subscriptions'
    },
    {
      step: 3,
      title: 'Track & Manage',
      description: 'Monitor spending and get insights'
    }
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

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Stack
          spacing={6}
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: '90vh', textAlign: 'center', py: 8 }}
        >
          {isAuthenticated ? (
            // Authenticated User View
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
          ) : (
            // Unauthenticated User View
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
                  Stop subscription chaos. Track, manage, and optimize all your recurring payments 
                  from one beautiful, secure dashboard. Save money and never miss a payment again.
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
                      background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
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

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                style={{ width: '100%' }}
              >
                <Grid container spacing={4} sx={{ mt: 8, maxWidth: '800px', margin: '0 auto' }}>
                  {stats.map((stat, index) => (
                    <Grid size={{ xs: 6, md: 4 }} key={stat.label}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 800,
                              color: '#7E57C2',
                              mb: 1,
                            }}
                          >
                            {stat.value}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 500,
                            }}
                          >
                            {stat.label}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </>
          )}
        </Stack>

        {/* Features Section - Only for unauthenticated users */}
        {!isAuthenticated && (
          <Box sx={{ py: 12 }}>
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 700,
                    color: '#7E57C2',
                    textAlign: 'center',
                    mb: 2,
                  }}
                >
                  Why Choose Subscription Manager?
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    mb: 10,
                    maxWidth: '600px',
                    margin: '0 auto',
                  }}
                >
                  Everything you need to take control of your subscription spending
                </Typography>
              </motion.div>

              <Grid container spacing={4} marginTop={5}>
                {features.map((feature, index) => (
                  <Grid size={{ xs: 12, md: 6, lg: 3 }} key={feature.title}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card
                        sx={{
                          p: 4,
                          height: '100%',
                          background: 'rgba(255, 255, 255, 0.7)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: 4,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 20px 60px rgba(126, 87, 194, 0.15)',
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: feature.color,
                            width: 60,
                            height: 60,
                            mb: 3,
                          }}
                        >
                          <feature.icon sx={{ fontSize: 30 }} />
                        </Avatar>
                        <Typography
                          variant="h5"
                          sx={{
                            color: '#7E57C2',
                            mb: 2,
                            fontWeight: 600,
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
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>
        )}

        {/* How It Works Section */}
        {!isAuthenticated && (
          <Box sx={{ py: 12 }}>
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 700,
                    color: '#7E57C2',
                    textAlign: 'center',
                    mb: 2,
                  }}
                >
                  How It Works
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    mb: 8,
                  }}
                >
                  Get started in just 3 simple steps
                </Typography>
              </motion.div>

              <Grid container spacing={4} sx={{ maxWidth: '900px', margin: '0 auto' }}>
                {steps.map((step, index) => (
                  <Grid size={{ xs: 12, md: 4 }} key={step.step}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      viewport={{ once: true }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor: 'rgba(126, 87, 194, 0.1)',
                            width: 80,
                            height: 80,
                            mb: 3,
                            mx: 'auto',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#7E57C2',
                            border: '2px solid rgba(126, 87, 194, 0.2)',
                          }}
                        >
                          {step.step}
                        </Avatar>
                        <Typography
                          variant="h5"
                          sx={{
                            color: '#7E57C2',
                            mb: 2,
                            fontWeight: 600,
                          }}
                        >
                          {step.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'text.secondary',
                          }}
                        >
                          {step.description}
                        </Typography>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              {/* Final CTA */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                style={{ textAlign: 'center', marginTop: '6rem' }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#7E57C2',
                    mb: 4,
                  }}
                >
                  Ready to Take Control?
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/auth?form=signup')}
                  sx={{
                    py: 3,
                    px: 8,
                    fontSize: '1.2rem',
                    background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                    color: 'white',
                    borderRadius: 3,
                    fontWeight: 700,
                    boxShadow: '0 8px 32px rgba(126, 87, 194, 0.3)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 16px 48px rgba(126, 87, 194, 0.4)',
                      transform: 'translateY(-4px) scale(1.02)',
                    },
                  }}
                >
                  Start Managing Your Subscriptions Now
                </Button>
              </motion.div>
            </Container>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default LandingPage;