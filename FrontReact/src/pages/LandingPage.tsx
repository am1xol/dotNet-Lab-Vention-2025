import React from 'react';
import { Box, Container, Stack } from '@mui/material';
import { useAuthStore } from '../store/auth-store';
import Header from '../components/layout/Header';
import FloatingIcons from '../components/shared/FloatingServiceIcons';

import { AuthenticatedHero } from '../components/landing/Hero/AuthenticatedHero';
import { UnauthenticatedHero } from '../components/landing/Hero/UnauthenticatedHero';
import { FeaturesSection } from '../components/landing/Features/FeaturesSection';
import { HowItWorksSection } from '../components/landing/HowItWorks/HowItWorksSection';

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FloatingIcons />
      <Header />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack
          spacing={6}
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: '90vh', textAlign: 'center', py: 8 }}
        >
          {isAuthenticated ? <AuthenticatedHero /> : <UnauthenticatedHero />}
        </Stack>
      </Container>

      {!isAuthenticated && (
        <>
          <FeaturesSection />
          <HowItWorksSection />
        </>
      )}
    </Box>
  );
};

export default LandingPage;
