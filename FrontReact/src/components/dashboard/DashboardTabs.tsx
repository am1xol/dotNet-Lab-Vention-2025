import React, { memo } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import {
  GroupedSubscriptions,
  GroupedUserSubscriptions,
  UserSubscription,
} from '../../types/subscription';
import { AvailableSubscriptionsTab } from '../subscriptions/AvailableSubscriptionsTab';
import { MySubscriptionsTab } from '../subscriptions/MySubscriptionsTab';
import { PaymentHistoryTab } from '../payment/PaymentHistoryTab';
import { SubscriptionHistoryTab } from '../subscriptions/SubscriptionHistoryTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Fixed TabPanel - keeps children mounted but hidden to prevent data refetching
const TabPanel: React.FC<TabPanelProps> = memo(({
  children,
  value,
  index,
  ...other
}) => {
  const isActive = value === index;
  return (
    <div 
      role="tabpanel" 
      id={`dashboard-tabpanel-${index}`} 
      {...other}
      aria-hidden={!isActive}
      style={{
        display: isActive ? 'block' : 'none',
      }}
    >
      <Box sx={{ p: 3 }}>{children}</Box>
    </div>
  );
});

interface UnsubscribeInfo {
  validUntil: string;
}

interface DashboardTabsProps {
  tabValue: number;
  handleTabChange: (newValue: number) => void;
  availableSubscriptions: GroupedSubscriptions;
  mySubscriptions: GroupedUserSubscriptions;
  actionLoading: string | null;
  unsubscribedData: { [key: string]: UnsubscribeInfo };
  getUserSubscription: (subscriptionId: string) => UserSubscription | undefined;
  handleSubscribe: (subscriptionId: string) => Promise<void>;
  handleInitiatePayment: (subscriptionId: string) => Promise<void>;
  handleUnsubscribe: (subscriptionId: string) => Promise<void>;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = memo(({
  tabValue,
  handleTabChange,
  mySubscriptions,
  actionLoading,
  unsubscribedData,
  getUserSubscription,
  handleSubscribe,
  handleInitiatePayment,
  handleUnsubscribe,
}) => {
  return (
    <motion.div
      key="dashboard-tabs" // Prevents re-animation on parent re-renders
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
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
            <Tab label="Payment History" />
            <Tab label="Subscription History" />
          </Tabs>
        </Box>

        {/* Available Subscriptions Tab */}
        <TabPanel value={tabValue} index={0}>
          <AvailableSubscriptionsTab
            actionLoading={actionLoading}
            unsubscribeData={unsubscribedData}
            getUserSubscription={getUserSubscription}
            handleSubscribe={handleSubscribe}
            handleInitiatePayment={handleInitiatePayment}
            handleUnsubscribe={handleUnsubscribe}
          />
        </TabPanel>

        {/* My Subscriptions Tab */}
        <TabPanel value={tabValue} index={1}>
          <MySubscriptionsTab
            mySubscriptions={mySubscriptions}
            actionLoading={actionLoading}
            unsubscribedData={unsubscribedData}
            handleSubscribe={handleSubscribe}
            handleInitiatePayment={handleInitiatePayment}
            handleUnsubscribe={handleUnsubscribe}
          />
        </TabPanel>

        {/* Payment History Tab */}
        <TabPanel value={tabValue} index={2}>
          <PaymentHistoryTab />
        </TabPanel>

        {/* Subscription History Tab */}
        <TabPanel value={tabValue} index={3}>
          <SubscriptionHistoryTab />
        </TabPanel>
      </Paper>
    </motion.div>
  );
});

// Add memo comparison function
DashboardTabs.displayName = 'DashboardTabs';
