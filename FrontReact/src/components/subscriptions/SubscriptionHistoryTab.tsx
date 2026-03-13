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
      setError('Failed to load subscription history');
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Expired':
        return 'default';
      case 'Cancelled':
        return 'warning';
      default:
        return 'default';
    }
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
        Subscription History
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
                No subscription history found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your subscriptions (active and past) will appear here.
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
                                Period: {sub.periodName} • Started:{' '}
                                {formatDate(sub.startDate)}{' '}
                                {sub.validUntil && (
                                  <>
                                    • Valid until: {formatDate(sub.validUntil)}
                                  </>
                                )}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Price: {sub.finalPrice} BYN
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Chip
                                label={sub.status || (sub.isActive ? 'Active' : 'Inactive')}
                                size="small"
                                color={getStatusColor(sub.status || undefined)}
                                sx={{ mt: 1 }}
                              />
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
                    {loading ? <CircularProgress size={24} /> : 'Load More'}
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

