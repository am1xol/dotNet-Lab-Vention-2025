import React, { useMemo, memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Stack,
  LinearProgress,
} from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { UserStatistics as UserStatisticsType } from '../../types/payment';
import {
  calendarDaysFromToday,
  formatDateNumeric,
  parseUtcDate,
  ruDayWord,
} from '../../utils/date-utils';
import { translations } from '../../i18n/translations';
import { BynAmount } from '../shared/BynAmount';

interface UserStatisticsProps {
  statistics: UserStatisticsType;
}

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
    </Box>
  );
});
