import React from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import {
  GroupedSubscriptions,
  GroupedUserSubscriptions,
  UserSubscription,
} from '../../types/subscription';
import { PaymentInfo } from '../../types/payment';
import { AvailableSubscriptionsTab } from '../subscriptions/AvailableSubscriptionsTab';
import { MySubscriptionsTab } from '../subscriptions/MySubscriptionsTab';
import { PaymentHistoryTab } from '../payment/PaymentHistoryTab';
import { AdminSubscriptionPanel } from '../subscriptions/AdminSubscriptionPanel';

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

interface UnsubscribeInfo {
  validUntil: string;
}

interface DashboardTabsProps {
  userRole: string;
  tabValue: number;
  handleTabChange: (newValue: number) => void;
  availableSubscriptions: GroupedSubscriptions;
  mySubscriptions: GroupedUserSubscriptions;
  actionLoading: string | null;
  unsubscribedData: { [key: string]: UnsubscribeInfo };
  getUserSubscription: (subscriptionId: string) => UserSubscription | undefined;
  handleSubscribe: (subscriptionId: string) => Promise<void>;
  handleSubscribeWithPayment: (
    subscriptionId: string,
    paymentInfo: PaymentInfo
  ) => Promise<void>;
  handleUnsubscribe: (subscriptionId: string) => Promise<void>;
  loadData: () => Promise<void>;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  userRole,
  tabValue,
  handleTabChange,
  availableSubscriptions,
  mySubscriptions,
  actionLoading,
  unsubscribedData,
  getUserSubscription,
  handleSubscribe,
  handleSubscribeWithPayment,
  handleUnsubscribe,
  loadData,
}) => {
  return (
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
            {userRole === 'Admin' && <Tab label="Manage Subscriptions" />}
          </Tabs>
        </Box>

        {/* Available Subscriptions Tab */}
        <TabPanel value={tabValue} index={0}>
          <AvailableSubscriptionsTab
            availableSubscriptions={availableSubscriptions}
            actionLoading={actionLoading}
            unsubscribeData={unsubscribedData}
            getUserSubscription={getUserSubscription}
            handleSubscribe={handleSubscribe}
            handleSubscribeWithPayment={handleSubscribeWithPayment}
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
            handleSubscribeWithPayment={handleSubscribeWithPayment}
            handleUnsubscribe={handleUnsubscribe}
          />
        </TabPanel>

        {/* Payment History Tab */}
        <TabPanel value={tabValue} index={2}>
          <PaymentHistoryTab />
        </TabPanel>

        {/* Admin Management Tab */}
        {userRole === 'Admin' && (
          <TabPanel value={tabValue} index={3}>
            <AdminSubscriptionPanel
              onSubscriptionCreated={loadData}
              onSubscriptionUpdated={loadData}
              onSubscriptionDeleted={loadData}
            />
          </TabPanel>
        )}
      </Paper>
    </motion.div>
  );
};