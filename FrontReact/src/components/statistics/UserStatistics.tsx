import React, { useMemo, memo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Receipt,
  Schedule,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  UserStatistics as UserStatisticsType,
  UpcomingPayment,
} from '../../types/payment';
import {
  calendarDaysFromToday,
  formatDate,
  formatDateNumeric,
  parseUtcDate,
  ruDayWord,
} from '../../utils/date-utils';
import { translations } from '../../i18n/translations';
import { BynAmount } from '../shared/BynAmount';

interface UserStatisticsProps {
  statistics: UserStatisticsType;
}

const PAYMENTS_LIST_PAGE_SIZE = 5;
const PAYMENTS_LIST_AREA_MIN_HEIGHT = 380;

const UpcomingPaymentsCard = memo(function UpcomingPaymentsCard({
  upcomingPayments,
}: {
  upcomingPayments: UpcomingPayment[];
}) {
  const upcomingTotalPages = Math.max(
    1,
    Math.ceil(upcomingPayments.length / PAYMENTS_LIST_PAGE_SIZE)
  );

  const [upcomingPage, setUpcomingPage] = useState(0);

  useEffect(() => {
    setUpcomingPage((p) => Math.min(p, upcomingTotalPages - 1));
  }, [upcomingPayments.length, upcomingTotalPages]);

  const upcomingPageItems = useMemo(
    () =>
      upcomingPayments.slice(
        upcomingPage * PAYMENTS_LIST_PAGE_SIZE,
        upcomingPage * PAYMENTS_LIST_PAGE_SIZE + PAYMENTS_LIST_PAGE_SIZE
      ),
    [upcomingPayments, upcomingPage]
  );

  const UpcomingRow = ({
    upcoming,
    index,
    showDivider,
  }: {
    upcoming: UpcomingPayment;
    index: number;
    showDivider: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <ListItem sx={{ px: 0 }}>
        <ListItemText
          primary={
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight="600" component="div">
                  {upcoming.subscriptionName}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="div"
                  >
                    {translations.statistics.dueDate}{' '}
                    {formatDate(upcoming.nextBillingDate)}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="body1"
                fontWeight="700"
                color="warning.main"
                component="div"
              >
                <BynAmount amount={upcoming.amount} />
              </Typography>
            </Box>
          }
        />
      </ListItem>
      {showDivider && <Divider sx={{ my: 1 }} />}
    </motion.div>
  );

  const UpcomingRowPlaceholder = ({ showDivider }: { showDivider: boolean }) => (
    <>
      <ListItem
        sx={{ px: 0, visibility: 'hidden', pointerEvents: 'none' }}
        aria-hidden
      >
        <ListItemText
          primary={
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight="600" component="div">
                  &nbsp;
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" component="div">
                    &nbsp;
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" fontWeight="700" component="div">
                &nbsp;
              </Typography>
            </Box>
          }
        />
      </ListItem>
      {showDivider && <Divider sx={{ my: 1, opacity: 0, borderColor: 'transparent' }} />}
    </>
  );

  const renderUpcomingListBody = () => {
    if (upcomingPayments.length === 0) {
      return (
        <ListItem>
          <ListItemText
            primary={
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {translations.statistics.noUpcomingPayments}
              </Typography>
            }
            secondary={
              <Typography
                variant="caption"
                color="text.secondary"
                textAlign="center"
              >
                {translations.statistics.upcomingBillsWillAppearHere}
              </Typography>
            }
          />
        </ListItem>
      );
    }

    if (upcomingTotalPages > 1) {
      return Array.from({ length: PAYMENTS_LIST_PAGE_SIZE }).map((_, slotIndex) => {
        const item = upcomingPageItems[slotIndex];
        const showDivider = slotIndex < PAYMENTS_LIST_PAGE_SIZE - 1;
        if (item) {
          return (
            <UpcomingRow
              key={`${item.subscriptionId}-${upcomingPage}-${slotIndex}`}
              upcoming={item}
              index={slotIndex}
              showDivider={showDivider}
            />
          );
        }
        return (
          <UpcomingRowPlaceholder
            key={`pad-${upcomingPage}-${slotIndex}`}
            showDivider={showDivider}
          />
        );
      });
    }

    return upcomingPageItems.map((upcoming, index) => (
      <UpcomingRow
        key={upcoming.subscriptionId}
        upcoming={upcoming}
        index={index}
        showDivider={index < upcomingPageItems.length - 1}
      />
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      style={{ flex: 1, display: 'flex', minWidth: 0 }}
    >
      <Card
        sx={{
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent
          sx={{
            p: 3,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box display="flex" alignItems="center" mb={3}>
            <Schedule
              sx={{
                fontSize: 28,
                color: '#FF9800',
                mr: 2,
              }}
            />
            <Typography variant="h6" fontWeight="700" color="#FF9800">
              {translations.statistics.upcomingPaymentsTitle}
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: PAYMENTS_LIST_AREA_MIN_HEIGHT,
              overflow: 'hidden',
            }}
          >
            <List sx={{ pt: 0, pb: 0, flex: 1, overflow: 'hidden' }}>
              {renderUpcomingListBody()}
            </List>
          </Box>

          {upcomingPayments.length > 0 && upcomingTotalPages > 1 && (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={0.5}
              sx={{
                mt: 2,
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <IconButton
                size="small"
                aria-label="previous page"
                onClick={() => setUpcomingPage((p) => Math.max(0, p - 1))}
                disabled={upcomingPage === 0}
              >
                <ChevronLeft />
              </IconButton>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 56, textAlign: 'center', userSelect: 'none' }}
              >
                {translations.statistics.upcomingPaymentsPager
                  .replace('{current}', String(upcomingPage + 1))
                  .replace('{total}', String(upcomingTotalPages))}
              </Typography>
              <IconButton
                size="small"
                aria-label="next page"
                onClick={() =>
                  setUpcomingPage((p) =>
                    Math.min(upcomingTotalPages - 1, p + 1)
                  )
                }
                disabled={upcomingPage >= upcomingTotalPages - 1}
              >
                <ChevronRight />
              </IconButton>
            </Stack>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

const METRIC_TILE_MIN_H = 176;

const dashboardMetricCardSx = {
  height: '100%',
  minHeight: METRIC_TILE_MIN_H,
  borderRadius: 4,
  position: 'relative',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.82)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.45)',
  boxShadow: '0 8px 32px rgba(126, 87, 194, 0.1)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(126, 87, 194, 0.16)',
  },
} as const;

function DashboardMetricDecor() {
  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: -36,
          right: -28,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(126, 87, 194, 0.09) 0%, transparent 68%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -32,
          left: -24,
          width: 110,
          height: 110,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(179, 157, 219, 0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

const defaultMetricGridSize = { xs: 12, sm: 6, lg: 4 };

type MetricGridSizeProp = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

function DashboardMetricCard({
  title,
  subtitle,
  delay,
  children,
  contentCenter = false,
  metricGridSize = defaultMetricGridSize,
}: {
  title: string;
  subtitle: string;
  delay: number;
  children: React.ReactNode;
  contentCenter?: boolean;
  metricGridSize?: MetricGridSizeProp;
}) {
  return (
    <Grid size={metricGridSize}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay }}
        style={{ height: '100%' }}
      >
        <Card sx={dashboardMetricCardSx}>
          <DashboardMetricDecor />
          <CardContent
            sx={{
              p: 2.5,
              position: 'relative',
              zIndex: 1,
              height: '100%',
              minHeight: METRIC_TILE_MIN_H,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                mb: 1,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'text.secondary',
              }}
            >
              {title}
            </Typography>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                ...(contentCenter ? { justifyContent: 'center' } : {}),
              }}
            >
              {children}
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 'auto', pt: 2, lineHeight: 1.45 }}
            >
              {subtitle}
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </Grid>
  );
}

const FinancialOverviewBento = memo(function FinancialOverviewBento({
  totalSpent,
  activeSubscriptionsCount,
  totalSubscriptionsCount,
  nextBillingDate,
}: {
  totalSpent: number;
  activeSubscriptionsCount: number;
  totalSubscriptionsCount: number;
  nextBillingDate?: string;
}) {
  const activeShare =
    totalSubscriptionsCount > 0
      ? Math.round(
          (activeSubscriptionsCount / totalSubscriptionsCount) * 100
        )
      : 0;

  const nextParts = useMemo(() => {
    if (!nextBillingDate) return null;
    const d = parseUtcDate(nextBillingDate);
    if (Number.isNaN(d.getTime())) return null;
    const daysLeft = calendarDaysFromToday(d);
    return {
      day: d.toLocaleDateString('ru-RU', { day: '2-digit' }),
      month: d.toLocaleDateString('ru-RU', { month: 'long' }),
      weekday: d.toLocaleDateString('ru-RU', { weekday: 'long' }),
      numeric: formatDateNumeric(nextBillingDate),
      daysLeft,
    };
  }, [nextBillingDate]);

  return (
    <Grid container spacing={2.5} sx={{ mb: 4 }}>
      <DashboardMetricCard
        delay={0.08}
        title={translations.statistics.totalSpentTitle}
        subtitle={translations.statistics.totalSpentSubtitle}
        metricGridSize={{ xs: 12, sm: 6, lg: 3 }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            width: '100%',
            minWidth: 0,
          }}
        >
          <Typography
            component="div"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#7E57C2',
              minWidth: 0,
            }}
          >
            <BynAmount amount={totalSpent} />
          </Typography>
          <AccountBalanceWallet
            sx={{
              fontSize: { xs: 52, sm: 58 },
              color: '#7E57C2',
              opacity: 0.14,
              flexShrink: 0,
            }}
            aria-hidden
          />
        </Box>
      </DashboardMetricCard>

      <DashboardMetricCard
        delay={0.14}
        title={translations.statistics.activeSubscriptionsTitle}
        subtitle={translations.statistics.activeSubscriptionsSubtitle}
        metricGridSize={{ xs: 12, sm: 6, lg: 6 }}
      >
        <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.05, color: '#5E35B1' }}>
          {activeSubscriptionsCount}
        </Typography>
        <Box sx={{ mt: 2, width: '100%' }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            sx={{ mb: 0.75 }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {translations.statistics.totalSubscriptionsTitle}
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: '#7E57C2' }}>
              {activeSubscriptionsCount} / {totalSubscriptionsCount}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={totalSubscriptionsCount > 0 ? activeShare : 0}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'rgba(126, 87, 194, 0.12)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: 'linear-gradient(90deg, #7E57C2 0%, #B39DDB 100%)',
              },
            }}
            aria-label={translations.statistics.activeSubscriptionsTitle}
          />
        </Box>
      </DashboardMetricCard>

      <DashboardMetricCard
        delay={0.22}
        title={translations.statistics.nextBill}
        subtitle={translations.statistics.nextBillSubtitle}
        contentCenter
        metricGridSize={{ xs: 12, sm: 6, lg: 3 }}
      >
        {nextParts ? (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="stretch"
            sx={{
              justifyContent: 'space-between',
              flex: 1,
              width: '100%',
              minWidth: 0,
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="stretch"
              sx={{ flex: 1, minWidth: 0 }}
            >
              <Box
                sx={{
                  minWidth: 64,
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(126, 87, 194, 0.08)',
                  border: '1px solid rgba(126, 87, 194, 0.22)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1, color: '#5E35B1' }}>
                  {nextParts.day}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  sx={{ textTransform: 'capitalize', lineHeight: 1.2, color: '#5E35B1' }}
                >
                  {nextParts.month}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textTransform: 'capitalize', mt: 0.35 }}
                >
                  {nextParts.weekday}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {nextParts.numeric}
                </Typography>
              </Box>
            </Stack>
            <Box
              sx={{
                flexShrink: 0,
                width: 76,
                px: 1,
                py: 1,
                borderRadius: 2,
                bgcolor: 'rgba(126, 87, 194, 0.06)',
                border: '1px solid rgba(126, 87, 194, 0.18)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              {nextParts.daysLeft >= 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, lineHeight: 1.2, mb: 0.25 }}
                >
                  {translations.statistics.nextBillDaysLeftCaption}
                </Typography>
              )}
              {nextParts.daysLeft < 0 ? (
                <Typography
                  variant="body2"
                  fontWeight={800}
                  sx={{ lineHeight: 1.2, color: 'error.main' }}
                >
                  {translations.statistics.nextBillOverdue}
                </Typography>
              ) : nextParts.daysLeft === 0 ? (
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ lineHeight: 1.15, color: '#5E35B1' }}
                >
                  {translations.statistics.nextBillToday}
                </Typography>
              ) : nextParts.daysLeft === 1 ? (
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ lineHeight: 1.15, color: '#5E35B1' }}
                >
                  {translations.statistics.nextBillTomorrow}
                </Typography>
              ) : (
                <>
                  <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1, color: '#5E35B1' }}>
                    {nextParts.daysLeft}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.2 }}>
                    {ruDayWord(nextParts.daysLeft)}
                  </Typography>
                </>
              )}
            </Box>
          </Stack>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Typography variant="h4" fontWeight={800} color="text.disabled">
              —
            </Typography>
          </Box>
        )}
      </DashboardMetricCard>
    </Grid>
  );
});

export const UserStatistics: React.FC<UserStatisticsProps> = memo(({
  statistics,
}) => {
  const PaymentItem = ({ payment, index }: { payment: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <ListItem sx={{ px: 0 }}>
        <ListItemText
          primary={
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight="600" component="div">
                  {payment.subscription.name}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Chip
                    label={`${payment.cardBrand} •••• ${payment.cardLastFour}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 24,
                      '& .MuiChip-label': { px: 1, fontSize: '0.75rem' },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="div"
                  >
                    {formatDate(payment.paymentDate)}
                  </Typography>
                </Box>
              </Box>
              <Box textAlign="right" sx={{ ml: 2 }}>
                <Typography
                  variant="body1"
                  fontWeight="700"
                  color="primary"
                  component="div"
                >
                  <BynAmount amount={payment.amount} />
                </Typography>
                <Chip
                  label={payment.status}
                  size="small"
                  color={
                    payment.status === 'Completed'
                      ? 'success'
                      : payment.status === 'Failed'
                        ? 'error'
                        : 'default'
                  }
                  sx={{
                    mt: 0.5,
                    height: 20,
                    '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                  }}
                />
              </Box>
            </Box>
          }
        />
      </ListItem>
      {index <
        Math.min(statistics.recentPayments.length, PAYMENTS_LIST_PAGE_SIZE) -
          1 && (
        <Divider sx={{ my: 1 }} />
      )}
    </motion.div>
  );

  return (
    <Box sx={{ mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
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
            mb: 4,
          }}
        >
          {translations.statistics.financialOverview}
        </Typography>
      </motion.div>

      <FinancialOverviewBento
        totalSpent={statistics.totalSpent}
        activeSubscriptionsCount={statistics.activeSubscriptionsCount}
        totalSubscriptionsCount={statistics.totalSubscriptionsCount}
        nextBillingDate={statistics.nextBillingDate}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{ flex: 1, display: 'flex', minWidth: 0 }}
          >
            <Card
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box display="flex" alignItems="center" mb={3}>
                  <Receipt
                    sx={{
                      fontSize: 28,
                      color: '#7E57C2',
                      mr: 2,
                    }}
                  />
                  <Typography variant="h6" fontWeight="700" color="#7E57C2">
                    {translations.statistics.recentPayments}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: PAYMENTS_LIST_AREA_MIN_HEIGHT,
                    overflow: 'hidden',
                  }}
                >
                  <List sx={{ pt: 0, pb: 0, flex: 1, overflow: 'hidden' }}>
                    {statistics.recentPayments
                      .slice(0, PAYMENTS_LIST_PAGE_SIZE)
                      .map((payment, index) => (
                        <PaymentItem
                          key={payment.id}
                          payment={payment}
                          index={index}
                        />
                      ))}

                    {statistics.recentPayments.length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              textAlign="center"
                            >
                              {translations.statistics.noPaymentsYet}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              textAlign="center"
                            >
                              {translations.statistics.paymentHistoryWillAppearHere}
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
          <UpcomingPaymentsCard
            upcomingPayments={statistics.upcomingPayments}
          />
        </Grid>
      </Grid>
    </Box>
  );
});
