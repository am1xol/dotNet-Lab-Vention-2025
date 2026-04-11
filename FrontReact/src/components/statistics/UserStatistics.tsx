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
  Avatar,
  IconButton,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  Payment,
  CalendarToday,
  Subscriptions,
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
import { formatDate, formatDateNumeric } from '../../utils/date-utils';
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

export const UserStatistics: React.FC<UserStatisticsProps> = memo(({
  statistics,
}) => {
  const generateRandomCircles = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 80 + 40,
      top: Math.random() * 100 - 20,
      left: Math.random() * 100 - 10,
      opacity: Math.random() * 0.2 + 0.05,
    }));
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = '#7E57C2',
    delay = 0,
  }: {
    title: string;
    value: React.ReactNode;
    subtitle: string;
    icon: React.ElementType;
    color?: string;
    delay?: number;
  }) => {
    const circles = useMemo(() => generateRandomCircles(3), []);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
      >
        <Card
          sx={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}22 100%)`,
            color: 'white',
            borderRadius: 4,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {circles.map((circle) => (
            <Box
              key={circle.id}
              sx={{
                position: 'absolute',
                top: `${circle.top}%`,
                left: `${circle.left}%`,
                width: circle.size,
                height: circle.size,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                opacity: circle.opacity,
              }}
            />
          ))}

          <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Box
              display="flex"
              alignItems="flex-start"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h3" fontWeight="800" sx={{ mb: 1 }}>
                  {value}
                </Typography>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {subtitle}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  width: 60,
                  height: 60,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Icon sx={{ fontSize: 30 }} />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const StatCardVariant = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = '#7E57C2',
    delay = 0,
    variant = 'circles',
  }: {
    title: string;
    value: React.ReactNode;
    subtitle: string;
    icon: React.ElementType;
    color?: string;
    delay?: number;
    variant?: 'circles' | 'mixed';
  }) => {
    const generateMixedShapes = () => {
      const shapes = [];

      shapes.push(
        {
          type: 'circle',
          size: Math.random() * 60 + 40,
          top: Math.random() * 80 - 10,
          left: Math.random() * 80 - 10,
          opacity: Math.random() * 0.15 + 0.05,
        },
        {
          type: 'circle',
          size: Math.random() * 50 + 30,
          top: Math.random() * 90 - 20,
          left: Math.random() * 90 - 20,
          opacity: Math.random() * 0.12 + 0.03,
        }
      );

      if (variant === 'mixed') {
        shapes.push({
          type: 'ellipse',
          width: Math.random() * 80 + 40,
          height: Math.random() * 40 + 20,
          top: Math.random() * 70,
          left: Math.random() * 70,
          opacity: Math.random() * 0.1 + 0.02,
          rotate: Math.random() * 360,
        });
      }

      return shapes;
    };

    const shapes = generateMixedShapes();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
      >
        <Card
          sx={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}22 100%)`,
            color: 'white',
            borderRadius: 4,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {shapes.map((shape, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                top: `${shape.top}%`,
                left: `${shape.left}%`,
                width: shape.type === 'circle' ? shape.size : shape.width,
                height: shape.type === 'circle' ? shape.size : shape.height,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: shape.type === 'circle' ? '50%' : '50%',
                opacity: shape.opacity,
                transform: shape.rotate ? `rotate(${shape.rotate}deg)` : 'none',
              }}
            />
          ))}

          <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Box
              display="flex"
              alignItems="flex-start"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h3" fontWeight="800" sx={{ mb: 1 }}>
                  {value}
                </Typography>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {subtitle}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  width: 60,
                  height: 60,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Icon sx={{ fontSize: 30 }} />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

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

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title={translations.statistics.totalSpentTitle}
            value={<BynAmount amount={statistics.totalSpent} />}
            subtitle={translations.statistics.totalSpentSubtitle}
            icon={Payment}
            color="#7E57C2"
            delay={0.1}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCardVariant
            title={translations.statistics.activeSubscriptionsTitle}
            value={statistics.activeSubscriptionsCount.toString()}
            subtitle={translations.statistics.activeSubscriptionsSubtitle}
            icon={Subscriptions}
            color="#4CAF50"
            delay={0.2}
            variant="mixed"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title={translations.statistics.totalSubscriptionsTitle}
            value={statistics.totalSubscriptionsCount.toString()}
            subtitle={translations.statistics.totalSubscriptionsSubtitle}
            icon={TrendingUp}
            color="#2196F3"
            delay={0.3}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCardVariant
            title={translations.statistics.nextBill}
            value={
              statistics.nextBillingDate
                ? formatDateNumeric(statistics.nextBillingDate)
                : '—'
            }
            subtitle={translations.statistics.nextBillSubtitle}
            icon={CalendarToday}
            color="#FF9800"
            delay={0.4}
            variant="mixed"
          />
        </Grid>
      </Grid>

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
