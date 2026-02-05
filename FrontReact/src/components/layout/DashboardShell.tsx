import React from 'react';
import { Box, Container, CircularProgress, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FloatingIcons from '../shared/FloatingServiceIcons';
import Header from './Header';
import { NotificationWatcher } from '../shared/NotificationWatcher';

interface DashboardShellProps {
  children: React.ReactNode;
  loading: boolean;
}

const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  loading,
}) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={60} sx={{ color: '#7E57C2' }} />
      </Box>
    );
  }

  return (
    <Box
      className="hide-scrollbar"
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FloatingIcons />

      <NotificationWatcher />

      <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackToHome}
            sx={{
              color: '#7E57C2',
              borderColor: '#7E57C2',
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '0.9rem',
              padding: '8px 16px',
              minWidth: 'auto',
              borderWidth: '2px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(126, 87, 194, 0.2)',
              '&:hover': {
                borderColor: '#5E35B1',
                backgroundColor: 'rgba(126, 87, 194, 0.08)',
                borderWidth: '2px',
                boxShadow: '0 6px 20px rgba(126, 87, 194, 0.3)',
              },
            }}
          >
            Back to Home
          </Button>
        </motion.div>
      </Box>

      <Header />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default DashboardShell;
