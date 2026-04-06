import React, { useEffect, useState, memo } from 'react';
import { Box, Typography, Grid, CircularProgress, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SubscriptionCard } from '../subscriptions/SubscriptionCard';
import { UnsubscribeReasonDialog } from './UnsubscribeReasonDialog';
import { subscriptionService } from '../../services/subscription-service';
import {
  UserSubscription,
  SubscriptionsByCategory,
} from '../../types/subscription';
import {
  canFreezeUserSubscription,
  canRestoreCancelledUserSubscription,
} from '../../utils/subscription-utils';

interface UnsubscribeInfo {
  validUntil: string;
}

interface AvailableSubscriptionsTabProps {
  actionLoading: string | null;
  unsubscribeData: { [key: string]: UnsubscribeInfo };
  getUserSubscription: (subscriptionId: string) => UserSubscription | undefined;
  handleSubscribe: (subscriptionId: string) => Promise<void>;
  handleInitiatePayment: (subscriptionId: string) => Promise<void>;
  handleUnsubscribe: (
    subscriptionId: string,
    reason?: string,
    customReason?: string
  ) => Promise<void>;
  handleFreeze: (subscriptionId: string, freezeMonths: number) => Promise<void>;
  handleRestoreCancelled: (subscriptionId: string) => Promise<void>;
}

const PAGE_SIZE = 3;

export const AvailableSubscriptionsTab: React.FC<
  AvailableSubscriptionsTabProps
> = ({
  actionLoading,
  unsubscribeData,
  getUserSubscription,
  handleSubscribe,
  handleInitiatePayment,
  handleUnsubscribe,
  handleFreeze,
  handleRestoreCancelled,
}) => {
  const [categoriesData, setCategoriesData] = useState<SubscriptionsByCategory>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [selectedSubscriptionName, setSelectedSubscriptionName] = useState<string>('');

  useEffect(() => {
    const initData = async () => {
      try {
        const categories = await subscriptionService.getCategories();
        const initialData: SubscriptionsByCategory = {};

        for (const cat of categories) {
          const result = await subscriptionService.getSubscriptionsPaged(
            1,
            PAGE_SIZE,
            cat
          );
          initialData[cat] = {
            items: result.items,
            currentPage: result.pageNumber,
            totalPages: result.totalPages,
            totalCount: result.totalCount,
            isLoadingMore: false,
          };
        }
        setCategoriesData(initialData);
      } catch (error) {
        console.error('Failed to fetch subscriptions', error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleShowAll = (category: string) => {
    navigate(`/category/${category}`);
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

  if (loading)
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );

  return (
    <>
      {Object.entries(categoriesData).map(([category, data]) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
              sx={{ textTransform: 'capitalize', mb: 3 }}
            >
              {category}
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ ml: 2 }}
              >
                ({data.totalCount})
              </Typography>
            </Typography>

            <Grid container spacing={3}>
                {data.items.map((subscription) => {
                  if (!subscription || !subscription.id) return null;
                  const userSub = getUserSubscription(subscription.id);
                  const canFreeze = canFreezeUserSubscription(userSub);
                  const canRestore = canRestoreCancelledUserSubscription(userSub);
                  return (
                    <Grid key={subscription.id} size={{ xs: 12, md: 6, lg: 4 }}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SubscriptionCard
                          subscription={subscription}
                          prices={subscription.prices}
                          isSubscribed={!!userSub}
                          isCancelled={!!userSub?.cancelledAt && !userSub?.isFrozen}
                          isFrozen={!!userSub?.isFrozen}
                          frozenUntil={userSub?.frozenUntil}
                          canFreezeAndUnsubscribe={canFreeze}
                          canRestoreCancelled={canRestore}
                          validUntil={userSub?.validUntil}
                          unsubscribeInfo={unsubscribeData?.[subscription.id]}
                          onSubscribe={handleSubscribe}
                          onInitiatePayment={handleInitiatePayment}
                          onUnsubscribe={(id) =>
                            handleOpenUnsubscribeDialog(id, subscription.name)
                          }
                          onFreeze={handleFreeze}
                          onRestoreCancelled={handleRestoreCancelled}
                          loading={actionLoading === subscription.id}
                        />
                      </motion.div>
                    </Grid>
                  );
                })}
            </Grid>

            {data.currentPage < data.totalPages && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => handleShowAll(category)}
                >
                  Показать все ({data.totalCount})
                </Button>
              </Box>
            )}
          </Box>
        </motion.div>
      ))}

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

export default memo(AvailableSubscriptionsTab);
