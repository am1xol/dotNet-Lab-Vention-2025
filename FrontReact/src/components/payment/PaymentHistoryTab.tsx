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
import { motion } from 'framer-motion';
import { Payment, UpcomingPayment } from '../../types/payment';
import { userSubscriptionService } from '../../services/user-subscription-service';
import { formatDateTime } from '../../utils/date-utils';
import { translations } from '../../i18n/translations';
import { BynAmount } from '../shared/BynAmount';
import { UpcomingPaymentsCard } from './UpcomingPaymentsCard';

interface PagedPaymentResponse {
  items: Payment[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface PaymentHistoryTabProps {
  upcomingPayments: UpcomingPayment[];
}

export const PaymentHistoryTab: React.FC<PaymentHistoryTabProps> = ({
  upcomingPayments,
}) => {
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
      setError(translations.payments.loadPaymentHistoryError);
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

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  const showHistorySkeleton = loading && payments.length === 0;

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            color: '#7E57C2',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
          }}
        >
          {translations.payments.paymentsTab}
        </Typography>
      </motion.div>

      <Box sx={{ mb: 4 }}>
        <UpcomingPaymentsCard upcomingPayments={upcomingPayments} />
      </Box>

      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ color: '#7E57C2', mb: 2 }}
      >
        {translations.payments.allTransactions}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showHistorySkeleton ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Card
          sx={{
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 8px 32px rgba(126, 87, 194, 0.12)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {payments.length === 0 && !loading ? (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  {translations.payments.noPaymentHistoryFound}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {translations.payments.paymentHistoryWillAppearHere}
                </Typography>
              </Box>
            ) : (
              <>
                <List sx={{ py: 0 }}>
                  {payments.map((payment, index) => (
                    <React.Fragment key={payment.id}>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
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
                                  {formatDate(payment.paymentDate)} •{' '}
                                  {translations.payments.period}:{' '}
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
                                  <BynAmount amount={payment.amount} />
                                </Typography>
                                <Chip
                                  label={
                                    payment.status === 'Completed'
                                      ? translations.payments.completed
                                      : payment.status === 'Failed'
                                        ? translations.payments.failed
                                        : payment.status
                                  }
                                  size="small"
                                  color={
                                    payment.status === 'Completed'
                                      ? 'success'
                                      : payment.status === 'Failed'
                                        ? 'error'
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
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        translations.subscriptions.loadMore
                      )}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
