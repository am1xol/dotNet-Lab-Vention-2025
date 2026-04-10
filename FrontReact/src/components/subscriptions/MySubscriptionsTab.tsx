import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { SubscriptionCard } from '../subscriptions/SubscriptionCard';
import { UnsubscribeReasonDialog } from './UnsubscribeReasonDialog';
import {
  GroupedUserSubscriptions,
  UserSubscription,
} from '../../types/subscription';
import { translations } from '../../i18n/translations';
import {
  canFreezeUserSubscription,
  canRestoreCancelledUserSubscription,
  isUserSubscriptionInMySubscriptionsList,
} from '../../utils/subscription-utils';

interface UnsubscribeInfo {
  validUntil: string;
}

interface MySubscriptionsTabProps {
  mySubscriptions: GroupedUserSubscriptions;
  actionLoading: string | null;
  unsubscribedData: { [key: string]: UnsubscribeInfo };
  handleSubscribe: (subscriptionId: string) => Promise<void>;
  handleInitiatePayment: (subscriptionPriceId: string) => Promise<void>;
  handleUnsubscribe: (
    subscriptionId: string,
    reason?: string,
    customReason?: string
  ) => Promise<void>;
  handleFreeze: (subscriptionId: string, freezeMonths: number) => Promise<void>;
  handleRestoreCancelled: (subscriptionId: string) => Promise<void>;
}

const PAGE_SIZE = 3;

export const MySubscriptionsTab: React.FC<MySubscriptionsTabProps> = ({
  mySubscriptions,
  actionLoading,
  unsubscribedData,
  handleSubscribe,
  handleInitiatePayment,
  handleUnsubscribe,
  handleFreeze,
  handleRestoreCancelled,
}) => {
  const [displayData, setDisplayData] = useState<any>({});
  const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [selectedSubscriptionName, setSelectedSubscriptionName] = useState<string>('');

  useEffect(() => {
    const initialData: any = {};

    Object.entries(mySubscriptions).forEach(([category, subs]) => {
      const activeSubs = subs.filter(isUserSubscriptionInMySubscriptionsList);
      if (activeSubs.length > 0) {
        initialData[category] = {
          allLines: activeSubs,
          visibleItems: activeSubs.slice(0, PAGE_SIZE),
          currentPage: 1,
          totalCount: activeSubs.length,
        };
      }
    });
    setDisplayData(initialData);
  }, [mySubscriptions]);

  const loadMore = (category: string) => {
    const cat = displayData[category];
    const nextLimit = (cat.currentPage + 1) * PAGE_SIZE;

    setDisplayData((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        visibleItems: prev[category].allLines.slice(0, nextLimit),
        currentPage: prev[category].currentPage + 1,
      },
    }));
  };

  const handleOpenUnsubscribeDialog = (subscriptionId: string, subscriptionName: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setSelectedSubscriptionName(subscriptionName);
    setUnsubscribeDialogOpen(true);
  };

  const handleCloseUnsubscribeDialog = () => {
    setUnsubscribeDialogOpen(false);
    setSelectedSubscriptionId(null);
    setSelectedSubscriptionName('');
  };

  const handleConfirmUnsubscribe = async (reason: string, customReason?: string) => {
    if (selectedSubscriptionId) {
      await handleUnsubscribe(selectedSubscriptionId, reason, customReason);
      handleCloseUnsubscribeDialog();
    }
  };

  if (Object.keys(mySubscriptions).length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          {translations.subscriptions.noActiveSubscriptions}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {Object.entries(displayData).map(
        ([category, data]: [string, any], categoryIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
          >
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  color: '#7E57C2',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              >
                {category}
                <Typography
                  component="span"
                  variant="h6"
                  sx={{ ml: 2, opacity: 0.6 }}
                >
                  ({data.totalCount})
                </Typography>
              </Typography>

              <Grid container spacing={3}>
                <AnimatePresence mode="popLayout">
                  {data.visibleItems.map(
                    (userSubscription: UserSubscription) => {
                      const canFreeze = canFreezeUserSubscription(userSubscription);
                      const canRestore =
                        canRestoreCancelledUserSubscription(userSubscription);
                      return (
                      <Grid
                        key={userSubscription.id}
                        size={{ xs: 12, md: 6, lg: 4 }}
                        sx={{ display: 'flex' }}
                      >
                        <motion.div
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ width: '100%', display: 'flex', minWidth: 0 }}
                        >
                          <SubscriptionCard
                            subscription={userSubscription.subscription}
                            subscriptionPriceId={
                              userSubscription.subscriptionPriceId
                            }
                            periodName={userSubscription.periodName}
                            finalPrice={userSubscription.finalPrice}
                            isSubscribed
                            isCancelled={
                              !!userSubscription.cancelledAt &&
                              !userSubscription.isFrozen
                            }
                            isFrozen={!!userSubscription.isFrozen}
                            frozenUntil={userSubscription.frozenUntil}
                            canFreezeAndUnsubscribe={canFreeze}
                            canRestoreCancelled={canRestore}
                            validUntil={userSubscription.validUntil}
                            unsubscribeInfo={
                              unsubscribedData[userSubscription.subscription.id]
                            }
                            onSubscribe={handleSubscribe}
                            onInitiatePayment={handleInitiatePayment}
                            onUnsubscribe={(id) =>
                              handleOpenUnsubscribeDialog(
                                id,
                                userSubscription.subscription.name
                              )
                            }
                            onFreeze={handleFreeze}
                            onRestoreCancelled={handleRestoreCancelled}
                            loading={
                              actionLoading === userSubscription.subscription.id
                            }
                          />
                        </motion.div>
                      </Grid>
                    );
                    }
                  )}
                </AnimatePresence>
              </Grid>

              {data.visibleItems.length < data.totalCount && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button variant="outlined" onClick={() => loadMore(category)}>
                    {translations.nav.showMore}
                  </Button>
                </Box>
              )}
            </Box>
          </motion.div>
        )
      )}

      <UnsubscribeReasonDialog
        open={unsubscribeDialogOpen}
        onClose={handleCloseUnsubscribeDialog}
        onConfirm={handleConfirmUnsubscribe}
        subscriptionName={selectedSubscriptionName}
        loading={actionLoading !== null}
      />
    </>
  );
};
