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
} from '@mui/material';
import { Payment } from '../../types/payment';
import { userSubscriptionService } from '../../services/user-subscription-service';

export const PaymentHistoryTab: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      const paymentHistory = await userSubscriptionService.getPaymentHistory();
      setPayments(paymentHistory);
    } catch (err) {
      setError('Failed to load payment history');
      console.error('Error loading payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
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

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {payments.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No payment history found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your payment history will appear here after making payments
              </Typography>
            </Box>
          ) : (
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
                            <Typography variant="body2" color="text.secondary">
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
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
