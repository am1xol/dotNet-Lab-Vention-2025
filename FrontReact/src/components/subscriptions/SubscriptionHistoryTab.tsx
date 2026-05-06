import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import { UserSubscription } from '../../types/subscription';
import { userSubscriptionService } from '../../services/user-subscription-service';
import { formatDate } from '../../utils/date-utils';
import { translations } from '../../i18n/translations';
import { BynAmount } from '../shared/BynAmount';

interface PagedUserSubscriptionResponse {
  items: UserSubscription[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const SubscriptionHistoryTab: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 5;

  useEffect(() => {
    loadHistory(1, true);
  }, []);

  const loadHistory = async (pageNumber: number, isInitial: boolean = false) => {
    try {
      setLoading(true);
      const data =
        (await userSubscriptionService.getSubscriptionHistory(
          pageNumber,
          pageSize
        )) as PagedUserSubscriptionResponse;

      const newItems = data.items || [];

      if (isInitial) {
        setSubscriptions(newItems);
      } else {
        setSubscriptions((prev) => [...prev, ...newItems]);
      }

      setHasMore(newItems.length === pageSize);
    } catch (err) {
      setError(translations.payments.loadSubscriptionHistoryError);
      console.error('Error loading subscription history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadHistory(nextPage);
  };

  type ChipColor = 'default' | 'success' | 'warning' | 'error' | 'info';

  const getDerivedStatus = (sub: UserSubscription): { label: string; color: ChipColor } => {
    const now = new Date();
    const validUntilDate = sub.validUntil ? new Date(sub.validUntil) : null;

    const raw = (sub.status || '').trim();
    if (raw && raw !== 'Unknown') {
      switch (raw) {
        case 'Active':
          return { label: translations.subscriptions.active, color: 'success' };
        case 'Expired':
          return { label: translations.subscriptions.expired, color: 'default' };
        case 'Cancelled':
          return { label: translations.subscriptions.cancelled, color: 'warning' };
        case 'Frozen':
          return { label: translations.subscriptions.frozen, color: 'info' };
        case 'Failed':
          return { label: translations.subscriptions.paymentFailed, color: 'error' };
        case 'Pending':
          return { label: translations.subscriptions.pendingPayment, color: 'warning' };
        default:
          break;
      }
    }

    if (sub.isFrozen) return { label: translations.subscriptions.frozen, color: 'info' };
    if (sub.cancelledAt) return { label: translations.subscriptions.cancelled, color: 'warning' };
    if (sub.isActive) return { label: translations.subscriptions.active, color: 'success' };

    if (sub.isValid === false) return { label: translations.subscriptions.paymentFailed, color: 'error' };

    if (validUntilDate && validUntilDate < now) {
      return { label: translations.subscriptions.expired, color: 'default' };
    }

    return {
      label: translations.common.inactive,
      color: 'default',
    };
  };

  if (loading && subscriptions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ color: '#7E57C2', fontWeight: 700 }}
      >
        {translations.payments.subscriptionHistory}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {subscriptions.length === 0 && !loading ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                {translations.payments.noSubscriptionHistoryFound}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {translations.payments.subscriptionHistoryWillAppearHere}
              </Typography>
            </Box>
          ) : (
            <>
              <List>
                {subscriptions.map((sub, index) => (
                  <React.Fragment key={sub.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="flex-start"
                          >
                            <Box>
                              <Typography variant="h6" fontWeight="medium">
                                {sub.subscription.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {translations.payments.period}: {sub.periodName} • {translations.payments.started}:{' '}
                                {formatDate(sub.startDate)}{' '}
                                {sub.validUntil && (
                                  <>
                                    • {translations.payments.validUntil}: {formatDate(sub.validUntil)}
                                  </>
                                )}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {translations.common.price}: <BynAmount amount={sub.finalPrice} />
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              {(() => {
                                const ds = getDerivedStatus(sub);
                                return (
                              <Chip
                                    label={ds.label}
                                size="small"
                                    color={ds.color}
                                sx={{ mt: 1 }}
                              />
                                );
                              })()}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < subscriptions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              {hasMore && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outlined"
                  >
                    {loading ? <CircularProgress size={24} /> : translations.common.loadMore}
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

