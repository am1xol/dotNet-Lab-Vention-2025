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
  Star,
  LocalOffer,
} from '@mui/icons-material';
import { UserProfile as UserProfileType } from '../../types/user';
import { userService } from '../../services/user-service';
import { formatDate } from '../../utils/date-utils';
import Header from '../layout/Header';
import FloatingIcons from '../shared/FloatingServiceIcons';
import { ProfileForm } from './ProfileForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import { NotificationsTab } from './NotificationsTab';
import { FeedbackTab } from './FeedbackTab';
import { PromoCodesTab } from './PromoCodesTab';
import { notificationService } from '../../services/notification-service';
import { translations } from '../../i18n/translations';
import { useAuthStore } from '../../store/auth-store';

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeSection, setActiveSection] = useState<
    'profile' | 'security' | 'notifications' | 'promoCodes' | 'feedback'
  >('profile');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const setAuthUser = useAuthStore((state) => state.setUser);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUserNotifications(1, 100);
      setUnreadCount(data.items.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch unread count');
    }
  };

  useEffect(() => {
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
      setAuthUser(userData);
    } catch (err: any) {
      setError(translations.userProfile.failedToLoadProfile);
      enqueueSnackbar(translations.userProfile.failedToLoadProfile, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = (updatedUser: UserProfileType) => {
    setUser(updatedUser);
    setAuthUser(updatedUser);
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
          {error || translations.userProfile.failedToLoadProfile}
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
              {translations.userProfile.backToDashboard}
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
              {translations.userProfile.accountSettings}
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
              {translations.userProfile.manageYourInfo}
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
                        ? translations.userProfile.emailVerified
                        : translations.userProfile.emailNotVerified
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
                    {translations.userProfile.personalInfo}
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
                    {translations.userProfile.securityPassword}
                  </Button>

                  <Button
                    fullWidth
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
                    sx={{
                      justifyContent: 'flex-start',
                      borderRadius: 2,
                      py: 1.5,
                      ...(activeSection === 'notifications' && {
                        background:
                          'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                      }),
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                      }}
                    >
                      {translations.userProfile.notifications}
                      {unreadCount > 0 && (
                        <Typography
                          variant="caption"
                          sx={{
                            ml: 1,
                            color:
                              activeSection === 'notifications'
                                ? 'white'
                                : 'error.main',
                            fontWeight: 'bold',
                          }}
                        >
                          ({unreadCount})
                        </Typography>
                      )}
                    </Box>
                  </Button>

                  <Button
                    fullWidth
                    startIcon={<Star />}
                    onClick={() => setActiveSection('feedback')}
                    variant={
                      activeSection === 'feedback' ? 'contained' : 'text'
                    }
                    sx={{
                      justifyContent: 'flex-start',
                      borderRadius: 2,
                      py: 1.5,
                      ...(activeSection === 'feedback' && {
                        background:
                          'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                      }),
                    }}
                  >
                    {translations.userProfile.rateService}
                  </Button>

                  <Button
                    fullWidth
                    startIcon={<LocalOffer />}
                    onClick={() => setActiveSection('promoCodes')}
                    variant={
                      activeSection === 'promoCodes' ? 'contained' : 'text'
                    }
                    sx={{
                      justifyContent: 'flex-start',
                      borderRadius: 2,
                      py: 1.5,
                      ...(activeSection === 'promoCodes' && {
                        background:
                          'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                      }),
                    }}
                  >
                    {translations.userProfile.promoCodes}
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
                      {translations.userProfile.memberSince.replace('{date}', formatDate(user.createdAt))}
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
                    {activeSection === 'feedback' && (
                      <Star sx={{ color: '#7E57C2', mr: 2 }} />
                    )}
                    {activeSection === 'promoCodes' && (
                      <LocalOffer sx={{ color: '#7E57C2', mr: 2 }} />
                    )}

                    <Typography variant="h5" fontWeight="600" color="#7E57C2">
                      {activeSection === 'profile' && translations.userProfile.personalInfo}
                      {activeSection === 'security' && translations.userProfile.securitySettings}
                      {activeSection === 'notifications' && translations.userProfile.myNotifications}
                      {activeSection === 'feedback' && translations.userProfile.rateOurService}
                      {activeSection === 'promoCodes' && translations.userProfile.myPromoCodes}
                    </Typography>
                  </Box>

                  {activeSection === 'profile' && (
                    <ProfileForm
                      user={user}
                      onProfileUpdated={handleProfileUpdated}
                    />
                  )}
                  {activeSection === 'security' && <ChangePasswordForm />}
                  {activeSection === 'notifications' && (
                    <NotificationsTab onUnreadCountChanged={fetchUnreadCount} />
                  )}
                  {activeSection === 'promoCodes' && <PromoCodesTab />}
                  {activeSection === 'feedback' && <FeedbackTab />}
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};
