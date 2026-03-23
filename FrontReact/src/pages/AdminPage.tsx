import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth-store';
import { subscriptionService } from '../services/subscription-service';
import DashboardShell from '../components/layout/DashboardShell';
import { AdminSubscriptionPanel } from '../components/subscriptions/AdminSubscriptionPanel';
import { AdminUsersPanel } from '../components/subscriptions/AdminUsersPanel';
import { AdminReportsPanel } from '../components/reports/AdminReportsPanel';
import { AdminChatPanel } from '../components/chat/AdminChatPanel';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { translations } from '../i18n/translations';

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
    <div role="tabpanel" id={`admin-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const AdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      await subscriptionService.getSubscriptions();
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <DashboardShell loading={loading}>
      <Box sx={{ mb: 4 }}>
        <DashboardHeader />
      </Box>
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
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                p: 2,
                fontWeight: 700,
                color: '#7E57C2',
              }}
            >
              {translations.admin.title}
            </Typography>
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
              <Tab label={translations.admin.manageSubscriptions} />
              <Tab label={translations.admin.manageUsers} />
              <Tab label={translations.admin.reports} />
              <Tab label={translations.admin.supportChat} />
            </Tabs>
          </Box>

          {/* Manage Subscriptions Tab */}
          <TabPanel value={tabValue} index={0}>
            <AdminSubscriptionPanel
              onSubscriptionCreated={loadData}
              onSubscriptionUpdated={loadData}
              onSubscriptionDeleted={loadData}
            />
          </TabPanel>

          {/* Users Management Tab */}
          <TabPanel value={tabValue} index={1}>
            <AdminUsersPanel />
          </TabPanel>

          {/* Reports Tab */}
          <TabPanel value={tabValue} index={2}>
            <AdminReportsPanel />
          </TabPanel>

          {/* Chat Support Tab */}
          <TabPanel value={tabValue} index={3}>
            <AdminChatPanel />
          </TabPanel>
        </Paper>
      </motion.div>
    </DashboardShell>
  );
};
