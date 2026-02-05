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
  Grid,
  Avatar,
  Chip,
  Divider,
  Badge,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import {
  Security,
  Person,
  ArrowBack,
  VerifiedUser,
  CalendarToday,
  Notifications,
} from '@mui/icons-material';
import { UserProfile as UserProfileType } from '../../types/user';
import { userService } from '../../services/user-service';
import Header from '../layout/Header';
import FloatingIcons from '../shared/FloatingServiceIcons';
import { ProfileForm } from './ProfileForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import { NotificationsTab } from './NotificationsTab';
import { notificationService } from '../../services/notification-service';

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeSection, setActiveSection] = useState<
    'profile' | 'security' | 'notifications'
  >('profile');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await notificationService.getUserNotifications();
        setUnreadCount(data.filter((n) => !n.isRead).length);
      } catch (err) {
        console.error('Failed to fetch unread count');
      }
    };
    fetchUnreadCount();
  }, []);

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

  const getUserInitials = (user: UserProfileType) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
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

  if (error || !user) {
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
        <Alert
          severity="error"
          sx={{
            maxWidth: 400,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {error || 'Failed to load profile'}
        </Alert>
      </Box>
    );
  }

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

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              sx={{
                color: '#7E57C2',
                fontWeight: 600,
                mb: 2,
                '&:hover': {
                  backgroundColor: 'rgba(126, 87, 194, 0.08)',
                },
              }}
            >
              Back to Dashboard
            </Button>

            <Typography
              variant="h3"
              sx={{
                color: '#7E57C2',
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Account Settings
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
              Manage your personal information and security preferences
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Sidebar Navigation */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  p: 3,
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 3,
                }}
              >
                {/* User Summary */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: 'primary.main',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {getUserInitials(user)}
                  </Avatar>
                  <Typography variant="h6" fontWeight="600">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {user.email}
                  </Typography>
                  <Chip
                    icon={<VerifiedUser />}
                    label={
                      user.isEmailVerified
                        ? 'Email Verified'
                        : 'Email Not Verified'
                    }
                    color={user.isEmailVerified ? 'success' : 'warning'}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Navigation */}
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    startIcon={<Person />}
                    onClick={() => setActiveSection('profile')}
                    variant={activeSection === 'profile' ? 'contained' : 'text'}
                    sx={{
                      justifyContent: 'flex-start',
                      borderRadius: 2,
                      py: 1.5,
                      ...(activeSection === 'profile' && {
                        background:
                          'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                      }),
                    }}
                  >
                    Personal Information
                  </Button>

                  <Button
                    fullWidth
                    startIcon={<Security />}
                    onClick={() => setActiveSection('security')}
                    variant={
                      activeSection === 'security' ? 'contained' : 'text'
                    }
                    sx={{
                      justifyContent: 'flex-start',
                      borderRadius: 2,
                      py: 1.5,
                      ...(activeSection === 'security' && {
                        background:
                          'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                      }),
                    }}
                  >
                    Security & Password
                  </Button>

                  <Button
                    variant={
                      activeSection === 'notifications' ? 'contained' : 'text'
                    }
                    onClick={() => setActiveSection('notifications')}
                    startIcon={
                      <Badge
                        badgeContent={unreadCount}
                        color="error"
                        variant="dot"
                        invisible={unreadCount === 0}
                      >
                        <Notifications />
                      </Badge>
                    }
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Notifications
                    {unreadCount > 0 && (
                      <Typography
                        variant="caption"
                        sx={{ ml: 1, color: 'error.main', fontWeight: 'bold' }}
                      >
                        ({unreadCount})
                      </Typography>
                    )}
                  </Button>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Account Info */}
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday
                      sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Member since {formatDate(user.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Main Content */}
            <Grid size={{ xs: 12, md: 8 }}>
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  sx={{
                    p: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 3,
                    minHeight: 400,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    {activeSection === 'profile' && (
                      <Person sx={{ color: '#7E57C2', mr: 2 }} />
                    )}
                    {activeSection === 'security' && (
                      <Security sx={{ color: '#7E57C2', mr: 2 }} />
                    )}
                    {activeSection === 'notifications' && (
                      <Notifications sx={{ color: '#7E57C2', mr: 2 }} />
                    )}

                    <Typography variant="h5" fontWeight="600" color="#7E57C2">
                      {activeSection === 'profile' && 'Personal Information'}
                      {activeSection === 'security' && 'Security Settings'}
                      {activeSection === 'notifications' && 'My Notifications'}
                    </Typography>
                  </Box>

                  {activeSection === 'profile' && (
                    <ProfileForm
                      user={user}
                      onProfileUpdated={handleProfileUpdated}
                    />
                  )}
                  {activeSection === 'security' && <ChangePasswordForm />}
                  {activeSection === 'notifications' && <NotificationsTab />}
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};
