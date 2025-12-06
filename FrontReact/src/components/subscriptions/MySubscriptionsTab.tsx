import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { SubscriptionCard } from '../subscriptions/SubscriptionCard';
import {
  GroupedUserSubscriptions,
  UserSubscription,
} from '../../types/subscription';
import { PaymentInfo } from '../../types/payment';

interface UnsubscribeInfo {
  validUntil: string;
}

interface MySubscriptionsTabProps {
  mySubscriptions: GroupedUserSubscriptions;
  actionLoading: string | null;
  unsubscribedData: { [key: string]: UnsubscribeInfo };
  handleSubscribe: (subscriptionId: string) => Promise<void>;
  handleSubscribeWithPayment: (
    subscriptionId: string,
    paymentInfo: PaymentInfo
  ) => Promise<void>;
  handleUnsubscribe: (subscriptionId: string) => Promise<void>;
}

export const MySubscriptionsTab: React.FC<MySubscriptionsTabProps> = ({
  mySubscriptions,
  actionLoading,
  unsubscribedData,
  handleSubscribe,
  handleSubscribeWithPayment,
  handleUnsubscribe,
}) => {
  const getUnsubscribeInfo = (subscriptionId: string) => {
    return unsubscribedData[subscriptionId];
  };

  if (Object.keys(mySubscriptions).length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            You are not subscribed to any services yet.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explore available subscriptions to get started!
          </Typography>
        </Box>
      </motion.div>
    );
  }

  return (
    <>
      {Object.entries(mySubscriptions).map(
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
                  .filter((us) => us.isActive)
                  .map((userSubscription: UserSubscription, index: number) => {
                    const subscriptionId = userSubscription.subscription.id;
                    const unsubscribeInfo = getUnsubscribeInfo(subscriptionId);

                    return (
                      <Grid size = {{ xs:12, md:6, lg:4}} key={userSubscription.id}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.05,
                          }}
                        >
                          <SubscriptionCard
                            subscription={userSubscription.subscription}
                            isSubscribed={userSubscription.isActive}
                            isCancelled={userSubscription.cancelledAt != null}
                            validUntil={userSubscription.validUntil}
                            unsubscribeInfo={unsubscribeInfo}
                            onSubscribe={handleSubscribe}
                            onSubscribeWithPayment={handleSubscribeWithPayment}
                            onUnsubscribe={handleUnsubscribe}
                            loading={actionLoading === subscriptionId}
                          />
                        </motion.div>
                      </Grid>
                    );
                  })}
              </Grid>
            </Box>
          </motion.div>
        )
      )}
    </>
  );
};