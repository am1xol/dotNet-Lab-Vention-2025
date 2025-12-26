import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { Payment } from '../../types/payment';
import { userSubscriptionService } from '../../services/user-subscription-service';

interface PagedPaymentResponse {
  items: Payment[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const PaymentHistoryTab: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 5;

  useEffect(() => {
    loadPaymentHistory(1, true);
  }, []);

  const loadPaymentHistory = async (
    pageNumber: number,
    isInitial: boolean = false
  ) => {
    try {
      setLoading(true);
      const data = (await userSubscriptionService.getPaymentHistory(
        pageNumber,
        pageSize
      )) as PagedPaymentResponse;

      const newPayments = data.items;

      if (isInitial) {
        setPayments(newPayments);
      } else {
        setPayments((prev) => [...prev, ...newPayments]);
      }

      setHasMore(newPayments.length === pageSize);
    } catch (err) {
      setError('Failed to load payment history');
      console.error('Error loading payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPaymentHistory(nextPage);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BYN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && payments.length === 0) {
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
        Payment History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {payments.length === 0 && !loading ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No payment history found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your payment history will appear here after making payments
              </Typography>
            </Box>
          ) : (
            <>
              <List>
                {payments.map((payment, index) => (
                  <React.Fragment key={payment.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="flex-start"
                          >
                            <Box>
                              <Typography variant="h6" fontWeight="medium">
                                {payment.subscription.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatDate(payment.paymentDate)} • Period:{' '}
                                {formatDate(payment.periodStart)} -{' '}
                                {formatDate(payment.periodEnd)}
                              </Typography>
                              <Box mt={1}>
                                <Chip
                                  label={`${payment.cardBrand} •••• ${payment.cardLastFour}`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                            <Box textAlign="right">
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                color="primary"
                              >
                                {formatCurrency(payment.amount)}
                              </Typography>
                              <Chip
                                label={payment.status}
                                size="small"
                                color={
                                  payment.status === 'Completed'
                                    ? 'success'
                                    : 'default'
                                }
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < payments.length - 1 && <Divider />}
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
