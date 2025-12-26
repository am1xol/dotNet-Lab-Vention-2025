import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress, Button } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { SubscriptionCard } from '../subscriptions/SubscriptionCard';
import { subscriptionService } from '../../services/subscription-service';
import {
  UserSubscription,
  SubscriptionsByCategory,
} from '../../types/subscription';
interface UnsubscribeInfo {
  validUntil: string;
}

interface AvailableSubscriptionsTabProps {
  actionLoading: string | null;
  unsubscribeData: { [key: string]: UnsubscribeInfo };
  getUserSubscription: (subscriptionId: string) => UserSubscription | undefined;
  handleSubscribe: (subscriptionId: string) => Promise<void>;
  handleInitiatePayment: (subscriptionId: string) => Promise<void>;
  handleUnsubscribe: (subscriptionId: string) => Promise<void>;
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
}) => {
  const [categoriesData, setCategoriesData] = useState<SubscriptionsByCategory>(
    {}
  );
  const [loading, setLoading] = useState(true);

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

  const loadMore = async (category: string) => {
    const currentCat = categoriesData[category];
    if (currentCat.currentPage >= currentCat.totalPages) return;

    setCategoriesData((prev: SubscriptionsByCategory) => ({
      ...prev,
      [category]: { ...prev[category], isLoadingMore: true },
    }));

    try {
      const nextPage = currentCat.currentPage + 1;
      const result = await subscriptionService.getSubscriptionsPaged(
        nextPage,
        PAGE_SIZE,
        category
      );

      setCategoriesData((prev: SubscriptionsByCategory) => ({
        ...prev,
        [category]: {
          ...prev[category],
          items: [...prev[category].items, ...result.items],
          currentPage: result.pageNumber,
          isLoadingMore: false,
        },
      }));
    } catch (error) {
      setCategoriesData((prev: SubscriptionsByCategory) => ({
        ...prev,
        [category]: { ...prev[category], isLoadingMore: false },
      }));
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
              <AnimatePresence>
                {data.items.map((subscription) => {
                  if (!subscription || !subscription.id) return null;
                  const userSub = getUserSubscription(subscription.id);
                  return (
                    <Grid key={subscription.id} size={{ xs: 12, md: 6, lg: 4 }}>
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <SubscriptionCard
                          subscription={subscription}
                          isSubscribed={!!userSub?.isActive}
                          isCancelled={!!userSub?.cancelledAt}
                          validUntil={userSub?.validUntil}
                          unsubscribeInfo={
                            unsubscribeData
                              ? unsubscribeData[subscription.id]
                              : undefined
                          }
                          onSubscribe={handleSubscribe}
                          onInitiatePayment={handleInitiatePayment}
                          onUnsubscribe={handleUnsubscribe}
                          loading={actionLoading === subscription.id}
                        />
                      </motion.div>
                    </Grid>
                  );
                })}
              </AnimatePresence>
            </Grid>

            {data.currentPage < data.totalPages && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => loadMore(category)}
                  disabled={data.isLoadingMore}
                >
                  {data.isLoadingMore ? 'Загрузка...' : 'Показать еще'}
                </Button>
              </Box>
            )}
          </Box>
        </motion.div>
      ))}
    </>
  );
};
