import React, { useState, useEffect } from 'react';
import { Stack, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth-store';
import { subscriptionService } from '../services/subscription-service';
import { userSubscriptionService } from '../services/user-subscription-service';
import { UserStatistics } from '../components/statistics/UserStatistics';
import {
  UserStatistics as UserStatisticsType,
  PaymentInitiationResult,
} from '../types/payment';
import {
  GroupedSubscriptions,
  GroupedUserSubscriptions,
  UserSubscription,
} from '../types/subscription';

import DashboardShell from '../components/layout/DashboardShell';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardTabs } from '../components/dashboard/DashboardTabs';

declare const BeGateway: new (options: any) => {
  createWidget: () => void;
};

export const DashboardPage: React.FC = () => {
  const [statistics, setStatistics] = useState<UserStatisticsType | null>(null);
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

      if (isAuthenticated) {
        await loadStatistics();
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await userSubscriptionService.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const handleInitiatePayment = async (subscriptionId: string) => {
    setActionLoading(subscriptionId);
    setError(null);
    try {
      const result: PaymentInitiationResult =
        await userSubscriptionService.initiatePayment(subscriptionId);

      if (typeof BeGateway !== 'undefined' && result.token) {
        console.log('Attempting to open BeGateway Widget...');

        const params = {
          checkout_url: 'https://checkout.bepaid.by',
          token: result.token,
          checkout: {
            iframe: true,
            transaction_type: 'payment',
          },
          closeWidget: function (status: string) {
            console.log(`BeGateway Widget closed. Status: ${status}`);

            if (status === 'successful' || status === 'failed') {
              loadData();
            }
          },
        };

        new BeGateway(params).createWidget();
      } else {
        console.error(
          'Widget failed. BeGateway defined:',
          typeof BeGateway !== 'undefined',
          'Token available:',
          !!result.token
        );
        window.open(result.redirectUrl, '_blank');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Не удалось инициировать платеж. Попробуйте еще раз.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubscribe = async (subscriptionId: string) => {
    try {
      setActionLoading(subscriptionId);
      await userSubscriptionService.subscribe(subscriptionId);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to subscribe');
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
        [subscriptionId]: { validUntil: response.validUntil },
      }));
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unsubscribe');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  const getUserSubscription = (
    subscriptionId: string
  ): UserSubscription | undefined => {
    if (!mySubscriptions) return undefined;

    const allUserSubscriptions = Object.values(mySubscriptions).flat();

    return allUserSubscriptions.find(
      (us) => us?.subscriptionId === subscriptionId && us?.isActive
    );
  };

  return (
    <DashboardShell loading={loading}>
      <Stack spacing={4}>
        <DashboardHeader />

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

        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <UserStatistics statistics={statistics} />
          </motion.div>
        )}

        <DashboardTabs
          userRole={userRole}
          tabValue={tabValue}
          handleTabChange={handleTabChange}
          availableSubscriptions={availableSubscriptions}
          mySubscriptions={mySubscriptions}
          actionLoading={actionLoading}
          unsubscribedData={unsubscribedData}
          getUserSubscription={getUserSubscription}
          handleSubscribe={handleSubscribe}
          handleInitiatePayment={handleInitiatePayment}
          handleUnsubscribe={handleUnsubscribe}
          loadData={loadData}
        />
      </Stack>
    </DashboardShell>
  );
};
