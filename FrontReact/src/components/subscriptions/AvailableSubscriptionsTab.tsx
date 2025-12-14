import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { SubscriptionCard } from '../subscriptions/SubscriptionCard';
import {
  GroupedSubscriptions,
  UserSubscription,
  Subscription,
} from '../../types/subscription';

interface UnsubscribeInfo {
  validUntil: string;
}

interface AvailableSubscriptionsTabProps {
  availableSubscriptions: GroupedSubscriptions;
  actionLoading: string | null;
  unsubscribeData: { [key: string]: UnsubscribeInfo };
  getUserSubscription: (subscriptionId: string) => UserSubscription | undefined;
  handleSubscribe: (subscriptionId: string) => Promise<void>;
  handleInitiatePayment: (subscriptionId: string) => Promise<void>;
  handleUnsubscribe: (subscriptionId: string) => Promise<void>;
}

export const AvailableSubscriptionsTab: React.FC<
  AvailableSubscriptionsTabProps
> = ({
  availableSubscriptions,
  actionLoading,
  unsubscribeData,
  getUserSubscription,
  handleSubscribe,
  handleInitiatePayment,
  handleUnsubscribe,
}) => {
  const getUnsubscribeInfo = (subscriptionId: string) => {
    return unsubscribeData[subscriptionId];
  };

  if (Object.keys(availableSubscriptions).length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No subscriptions available at the moment
          </Typography>
        </Box>
      </motion.div>
    );
  }

  return (
    <>
      {Object.entries(availableSubscriptions).map(
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
              <Typography variant="h4" gutterBottom>
                {category}
              </Typography>
              <Grid container spacing={3}>
                {subscriptions.map(
                  (subscription: Subscription, index: number) => {
                    const userSubscription = getUserSubscription(
                      subscription.id
                    );
                    const isSubscribed = userSubscription?.isActive || false;
                    const unsubscribeInfo = getUnsubscribeInfo(subscription.id);
                    const isCancelled = userSubscription?.cancelledAt != null;

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
                            onInitiatePayment={handleInitiatePayment}
                            onUnsubscribe={handleUnsubscribe}
                            loading={actionLoading === subscription.id}
                          />
                        </motion.div>
                      </Grid>
                    );
                  }
                )}
              </Grid>
            </Box>
          </motion.div>
        )
      )}
    </>
  );
};
