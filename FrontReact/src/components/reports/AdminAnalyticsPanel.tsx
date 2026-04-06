import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { reportService } from '../../services/report-service';
import { AdminAnalyticsDashboard } from '../../types/report';
import { translations } from '../../i18n/translations';

const emptyDashboard: AdminAnalyticsDashboard = {
  activeUsersCount: 0,
  categoryDistribution: [],
  newSubscriptionsCount: 0,
  cancelledSubscriptionsCount: 0,
  paidSubscriptionsCount: 0,
  expiringSubscriptionsCount: 0,
  successfulPaymentsCount: 0,
  failedPaymentsCount: 0,
};

const CHART_COLORS = ['#7E57C2', '#5C6BC0', '#26A69A', '#FFA726', '#EF5350', '#8D6E63', '#66BB6A'];

const StatCard: React.FC<{ label: string; value: number; accent?: string }> = ({
  label,
  value,
  accent = '#7E57C2',
}) => (
  <Card sx={{ borderRadius: 3, height: '100%' }}>
    <CardContent
      sx={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: -20,
          top: -25,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: `${accent}22`,
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, position: 'relative' }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, color: accent, position: 'relative' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export const AdminAnalyticsPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [periodDays, setPeriodDays] = useState(30);
  const [expiringWithinDays, setExpiringWithinDays] = useState(7);
  const [dashboard, setDashboard] = useState<AdminAnalyticsDashboard>(emptyDashboard);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await reportService.getAnalyticsDashboard(periodDays, expiringWithinDays);
      setDashboard(data);
    } catch (e) {
      console.error('Failed to load analytics dashboard', e);
      setError(translations.admin.failedToLoadAnalyticsDashboard);
      setDashboard(emptyDashboard);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [periodDays, expiringWithinDays]);

  const categoryChartData = useMemo(
    () =>
      dashboard.categoryDistribution.map((item, index) => ({
        ...item,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [dashboard.categoryDistribution]
  );

  const subscriptionsMonitoringData = useMemo(
    () => [
      {
        name: translations.admin.analyticsNewSubscriptionsShort,
        value: dashboard.newSubscriptionsCount,
      },
      {
        name: translations.admin.analyticsCancelledSubscriptionsShort,
        value: dashboard.cancelledSubscriptionsCount,
      },
      {
        name: translations.admin.analyticsPaidSubscriptionsShort,
        value: dashboard.paidSubscriptionsCount,
      },
      {
        name: translations.admin.analyticsExpiringSubscriptionsShort,
        value: dashboard.expiringSubscriptionsCount,
      },
    ],
    [dashboard]
  );

  const paymentsStatusData = useMemo(
    () => [
      {
        name: translations.admin.analyticsSuccessfulPaymentsShort,
        value: dashboard.successfulPaymentsCount,
        fill: '#26A69A',
      },
      {
        name: translations.admin.analyticsFailedPaymentsShort,
        value: dashboard.failedPaymentsCount,
        fill: '#EF5350',
      },
    ],
    [dashboard]
  );

  return (
    <Card
      sx={{
        borderRadius: 3,
        background: 'rgba(255,255,255,0.85)',
        boxShadow: '0 8px 32px rgba(126, 87, 194, 0.15)',
      }}
    >
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ color: '#7E57C2', fontWeight: 700 }}>
          {translations.admin.analyticsTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {translations.admin.analyticsSubtitle}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
          <TextField
            label={translations.admin.analyticsPeriodDays}
            type="number"
            size="small"
            value={periodDays}
            onChange={(e) => setPeriodDays(Math.max(1, Number(e.target.value) || 1))}
            sx={{ width: 200 }}
          />
          <TextField
            label={translations.admin.analyticsExpiringDays}
            type="number"
            size="small"
            value={expiringWithinDays}
            onChange={(e) => setExpiringWithinDays(Math.max(1, Number(e.target.value) || 1))}
            sx={{ width: 240 }}
          />
          <Chip
            label={`${translations.admin.analyticsUpdated}: ${new Date().toLocaleString()}`}
            color="secondary"
            variant="outlined"
            sx={{ height: 40 }}
          />
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label={translations.admin.analyticsActiveUsers}
              value={dashboard.activeUsersCount}
              accent="#5C6BC0"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label={translations.admin.analyticsNewSubscriptions}
              value={dashboard.newSubscriptionsCount}
              accent="#42A5F5"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label={translations.admin.analyticsCancelledSubscriptions}
              value={dashboard.cancelledSubscriptionsCount}
              accent="#EF5350"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label={translations.admin.analyticsPaidSubscriptions}
              value={dashboard.paidSubscriptionsCount}
              accent="#26A69A"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label={translations.admin.analyticsExpiringSubscriptions}
              value={dashboard.expiringSubscriptionsCount}
              accent="#FFA726"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label={translations.admin.analyticsSuccessfulPayments}
              value={dashboard.successfulPaymentsCount}
              accent="#2E7D32"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label={translations.admin.analyticsFailedPayments}
              value={dashboard.failedPaymentsCount}
              accent="#C62828"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {translations.admin.analyticsCategoryDistribution}
                </Typography>
                {!categoryChartData.length ? (
                  <Typography variant="body2" color="text.secondary">
                    {translations.admin.noDataForSelectedReport}
                  </Typography>
                ) : (
                  <Box sx={{ height: 340 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="subscriptionsCount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          label
                        >
                          {categoryChartData.map((entry) => (
                            <Cell key={entry.category} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {translations.admin.analyticsSubscriptionsMonitoring}
                </Typography>
                <Box sx={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subscriptionsMonitoringData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#7E57C2" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {translations.admin.analyticsPaymentStatuses}
                </Typography>
                <Box sx={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentsStatusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {paymentsStatusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
