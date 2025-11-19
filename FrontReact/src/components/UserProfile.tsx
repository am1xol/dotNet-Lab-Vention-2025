import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  Alert,
  CircularProgress,
  Button,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import { UserProfile as UserProfileType } from '../types/user';
import { userService } from '../services/user-service';
import Header from './Header';
import FloatingIcons from './FloatingServiceIcons';
import { ProfileForm } from './ProfileForm';
import { ChangePasswordForm } from './ChangePasswordForm';

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await userService.getProfile();
      setUser(userData);
    } catch (err: any) {
      setError('Failed to load profile');
      enqueueSnackbar('Failed to load profile', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = (updatedUser: UserProfileType) => {
    setUser(updatedUser);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={60} sx={{ color: '#7E57C2' }} />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error || 'Failed to load profile'}
        </Alert>
      </Box>
    );
  }

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

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <Card sx={{ p: 4, mb: 4, background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h3" sx={{ color: '#7E57C2', fontWeight: 700, mb: 1 }}>
                  Profile Settings
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                  Manage your account information and security
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{
                  color: '#7E57C2',
                  borderColor: '#7E57C2',
                  fontWeight: 600,
                }}
              >
                Back to Home
              </Button>
            </Box>

            {/* User Info */}
            <Stack spacing={2} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Account Created:
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {formatDate(user.createdAt)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Email Status:
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: user.isEmailVerified ? 'success.main' : 'warning.main',
                    fontWeight: 600,
                  }}
                >
                  {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                </Typography>
              </Box>
            </Stack>
          </Card>

          {/* Forms */}
          <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
            <ProfileForm user={user} onProfileUpdated={handleProfileUpdated} />
            <ChangePasswordForm />
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};