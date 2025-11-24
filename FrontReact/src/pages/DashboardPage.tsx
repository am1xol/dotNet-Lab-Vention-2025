import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { subscriptionService } from '../services/subscription-service';
import { userSubscriptionService } from '../services/user-subscription-service';
import { SubscriptionCard } from '../components/subscriptions/SubscriptionCard';
import { AdminSubscriptionPanel } from '../components/subscriptions/AdminSubscriptionPanel';
import {
  GroupedSubscriptions,
  GroupedUserSubscriptions,
  UserSubscription,
} from '../types/subscription';
import Header from '../components/Header';
import FloatingIcons from '../components/FloatingServiceIcons';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [availableSubscriptions, setAvailableSubscriptions] =
    useState<GroupedSubscriptions>({});
  const [mySubscriptions, setMySubscriptions] =
    useState<GroupedUserSubscriptions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [unsubscribedData, setUnsubscribedData] = useState<{
    [key: string]: { validUntil: string };
  }>({});

  const { user, isAuthenticated } = useAuthStore();
  const userRole = user?.role || 'User';
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subscriptionsData, mySubscriptionsData] = await Promise.all([
        subscriptionService.getSubscriptions(),
        userSubscriptionService.getMySubscriptions(),
      ]);

      setAvailableSubscriptions(subscriptionsData);
      setMySubscriptions(mySubscriptionsData);
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (subscriptionId: string) => {
    try {
      setActionLoading(subscriptionId);
      await userSubscriptionService.subscribe(subscriptionId);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to subscribe');
      console.error('Error subscribing:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsubscribe = async (subscriptionId: string) => {
    try {
      setActionLoading(subscriptionId);
      const response =
        await userSubscriptionService.unsubscribe(subscriptionId);

      setUnsubscribedData((prev) => ({
        ...prev,
        [subscriptionId]: {
          validUntil: response.validUntil,
        },
      }));

      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unsubscribe');
      console.error('Error unsubscribing:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const getUnsubscribeInfo = (subscriptionId: string) => {
    return unsubscribedData[subscriptionId];
  };

  const getUserSubscription = (
    subscriptionId: string
  ): UserSubscription | undefined => {
    return Object.values(mySubscriptions)
      .flat()
      .find((us) => us.subscription.id === subscriptionId);
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
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FloatingIcons />

      {/* Кнопка возврата слева от Header */}
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
        <Stack spacing={4}>
          {/* Заголовок */}
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

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </motion.div>
          )}

          {/* Основной контент */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(126, 87, 194, 0.15)',
              }}
            >
              {/* Табы - ТОЛЬКО 2 вкладки */}
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Tabs
                  value={tabValue}
                  onChange={(_, newValue) => handleTabChange(newValue)}
                  textColor="inherit"
                  indicatorColor="secondary"
                  sx={{
                    px: 2,
                    '& .MuiTab-root': {
                      fontSize: '1rem',
                      fontWeight: 600,
                      py: 2.5,
                      color: 'text.secondary',
                      '&.Mui-selected': {
                        color: '#7E57C2',
                      },
                    },
                  }}
                >
                  <Tab label="Available Subscriptions" />
                  <Tab label="My Subscriptions" />
                  {userRole === 'Admin' && <Tab label="Manage Subscriptions" />}
                </Tabs>
              </Box>

              {/* Available Subscriptions Tab */}
              <TabPanel value={tabValue} index={0}>
                {Object.keys(availableSubscriptions).length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Box textAlign="center" py={8}>
                      <Typography variant="h6" color="text.secondary">
                        No subscriptions available at the moment
                      </Typography>
                    </Box>
                  </motion.div>
                ) : (
                  Object.entries(availableSubscriptions).map(
                    ([category, subscriptions], categoryIndex) => (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: categoryIndex * 0.1,
                        }}
                      >
                        <Box sx={{ mb: 6 }}>
                          <Typography
                            variant="h4"
                            gutterBottom
                            sx={{
                              mt: 2,
                              mb: 4,
                              color: '#7E57C2',
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              fontSize: '2rem',
                            }}
                          >
                            {category}
                          </Typography>
                          <Grid container spacing={3}>
                            {subscriptions.map((subscription, index) => {
                              const userSubscription = getUserSubscription(
                                subscription.id
                              );
                              const isSubscribed =
                                userSubscription?.isValid || false;
                              const unsubscribeInfo = getUnsubscribeInfo(
                                subscription.id
                              );
                              const isCancelled =
                                userSubscription?.cancelledAt != null;

                              return (
                                <Grid
                                  size={{ xs: 12, md: 6, lg: 4 }}
                                  key={subscription.id}
                                >
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                      duration: 0.5,
                                      delay: index * 0.05,
                                    }}
                                  >
                                    <SubscriptionCard
                                      subscription={subscription}
                                      isSubscribed={isSubscribed}
                                      isCancelled={isCancelled}
                                      validUntil={userSubscription?.validUntil}
                                      unsubscribeInfo={unsubscribeInfo}
                                      onSubscribe={handleSubscribe}
                                      onUnsubscribe={handleUnsubscribe}
                                      loading={
                                        actionLoading === subscription.id
                                      }
                                    />
                                  </motion.div>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      </motion.div>
                    )
                  )
                )}
              </TabPanel>

              {/* My Subscriptions Tab */}
              <TabPanel value={tabValue} index={1}>
                {Object.keys(mySubscriptions).length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Box textAlign="center" py={8}>
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        gutterBottom
                      >
                        You are not subscribed to any services yet.
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Explore available subscriptions to get started!
                      </Typography>
                    </Box>
                  </motion.div>
                ) : (
                  Object.entries(mySubscriptions).map(
                    ([category, userSubscriptions], categoryIndex) => (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: categoryIndex * 0.1,
                        }}
                      >
                        <Box key={category} sx={{ mb: 6 }}>
                          <Typography
                            variant="h4"
                            gutterBottom
                            sx={{
                              mt: 2,
                              mb: 4,
                              color: '#7E57C2',
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              fontSize: '2rem',
                            }}
                          >
                            {category}
                          </Typography>
                          <Grid container spacing={3}>
                            {userSubscriptions
                              .filter(
                                (us) => us.isValid || us.cancelledAt != null
                              )
                              .map((userSubscription, index) => {
                                const unsubscribeInfo = getUnsubscribeInfo(
                                  userSubscription.subscription.id
                                );

                                return (
                                  <Grid
                                    size={{ xs: 12, md: 6, lg: 4 }}
                                    key={userSubscription.id}
                                  >
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{
                                        duration: 0.5,
                                        delay: index * 0.05,
                                      }}
                                    >
                                      <SubscriptionCard
                                        subscription={
                                          userSubscription.subscription
                                        }
                                        isSubscribed={userSubscription.isValid}
                                        isCancelled={
                                          userSubscription.cancelledAt != null
                                        }
                                        validUntil={userSubscription.validUntil}
                                        unsubscribeInfo={unsubscribeInfo}
                                        onSubscribe={handleSubscribe}
                                        onUnsubscribe={handleUnsubscribe}
                                        loading={
                                          actionLoading ===
                                          userSubscription.subscription.id
                                        }
                                      />
                                    </motion.div>
                                  </Grid>
                                );
                              })}
                          </Grid>
                        </Box>
                      </motion.div>
                    )
                  )
                )}
              </TabPanel>

              {/* Admin Management Tab */}
              {userRole === 'Admin' && (
                <TabPanel value={tabValue} index={2}>
                  <AdminSubscriptionPanel
                    onSubscriptionCreated={loadData}
                    onSubscriptionUpdated={loadData}
                    onSubscriptionDeleted={loadData}
                  />
                </TabPanel>
              )}
            </Paper>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  );
};
