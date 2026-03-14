import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress,
  Stack,
} from '@mui/material';
import { reportService } from '../../services/report-service';
import {
  ActiveSubscriptionsByPlan,
  SubscriptionWithPlans,
  TopPopularSubscription,
  SubscriptionsByMonth,
  UserSubscriptionReportItem,
} from '../../types/report';

type ReportType =
  | 'activeByPlan'
  | 'subscriptionsWithPlans'
  | 'topPopular'
  | 'byMonth'
  | 'userSubscriptions';

type ExportFormat = 'csv' | 'word';

interface AdminReportsPanelProps {
  currentUserId?: string;
}

const normalizeForChart = (values: number[]) => {
  const max = Math.max(...values, 1);
  return values.map((v) => (v / max) * 100);
};

const exportToCsv = (filename: string, items: any[]) => {
  if (!items.length) return;
  const headers = Object.keys(items[0]);
  const rows = items.map((item) =>
    headers
      .map((h) => {
        const value = item[h];
        if (value === null || value === undefined) return '';
        const stringValue =
          value instanceof Date ? value.toISOString() : String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToWord = (filename: string, title: string, items: any[]) => {
  if (!items.length) return;
  const headers = Object.keys(items[0]);

  const headerRow = headers.map((h) => `<th>${h}</th>`).join('');
  const bodyRows = items
    .map((item) => {
      const tds = headers
        .map((h) => {
          const value = item[h];
          if (value === null || value === undefined) return '<td></td>';
          return `<td>${String(value)}</td>`;
        })
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${title}</title></head>
    <body>
      <h2>${title}</h2>
      <table border="1" cellpadding="4" cellspacing="0">
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body>
    </html>`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const AdminReportsPanel: React.FC<AdminReportsPanelProps> = ({
  currentUserId,
}) => {
  const [tab, setTab] = useState<ReportType>('activeByPlan');
  const [loading, setLoading] = useState(false);
  const [activeByPlan, setActiveByPlan] = useState<ActiveSubscriptionsByPlan[]>(
    []
  );
  const [subsWithPlans, setSubsWithPlans] = useState<SubscriptionWithPlans[]>(
    []
  );
  const [topPopular, setTopPopular] = useState<TopPopularSubscription[]>([]);
  const [byMonth, setByMonth] = useState<SubscriptionsByMonth[]>([]);
  const [userSubs, setUserSubs] = useState<UserSubscriptionReportItem[]>([]);

  const [topCount, setTopCount] = useState(5);
  const [userId, setUserId] = useState(currentUserId || '');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');

  useEffect(() => {
    loadCurrentTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadCurrentTab = async () => {
    try {
      setLoading(true);
      if (tab === 'activeByPlan') {
        const data = await reportService.getActiveByPlan();
        setActiveByPlan(data);
      } else if (tab === 'subscriptionsWithPlans') {
        const data = await reportService.getSubscriptionsWithPlans();
        setSubsWithPlans(data);
      } else if (tab === 'topPopular') {
        const data = await reportService.getTopPopular(topCount);
        setTopPopular(data);
      } else if (tab === 'byMonth') {
        const data = await reportService.getByMonth(periodFrom, periodTo);
        setByMonth(data);
      } else if (tab === 'userSubscriptions' && userId) {
        const data = await reportService.getUserSubscriptions(userId);
        setUserSubs(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: ExportFormat) => {
    let filename = 'report';
    let title = 'Report';
    let data: any[] = [];

    switch (tab) {
      case 'activeByPlan':
        filename = 'active-subscriptions-by-plan';
        title = 'Active subscriptions by plan';
        data = activeByPlan;
        break;
      case 'subscriptionsWithPlans':
        filename = 'subscriptions-with-plans';
        title = 'Subscriptions with plans';
        data = subsWithPlans;
        break;
      case 'topPopular':
        filename = 'top-popular-subscriptions';
        title = 'Top popular subscriptions';
        data = topPopular;
        break;
      case 'byMonth':
        filename = 'subscriptions-by-month';
        title = 'Subscriptions by month';
        data = byMonth;
        break;
      case 'userSubscriptions':
        filename = 'user-subscriptions';
        title = 'User subscriptions';
        data = userSubs;
        break;
    }

    if (!data.length) return;

    if (format === 'csv') {
      exportToCsv(filename, data);
    } else {
      exportToWord(filename, title, data);
    }
  };

  const chartData = useMemo(() => {
    if (tab === 'topPopular') {
      const counts = topPopular.map((x) => x.totalSubscriptionsCount);
      const percents = normalizeForChart(counts);
      return topPopular.map((x, idx) => ({
        label: x.subscriptionName,
        value: x.totalSubscriptionsCount,
        percent: percents[idx],
      }));
    }

    if (tab === 'activeByPlan') {
      const counts = activeByPlan.map((x) => x.activeSubscriptionsCount);
      const percents = normalizeForChart(counts);
      return activeByPlan.map((x, idx) => ({
        label: `${x.subscriptionName} (${x.periodName})`,
        value: x.activeSubscriptionsCount,
        percent: percents[idx],
      }));
    }

    if (tab === 'byMonth') {
      const counts = byMonth.map((x) => x.subscriptionsCount);
      const percents = normalizeForChart(counts);
      return byMonth.map((x, idx) => ({
        label: `${x.year}-${String(x.month).padStart(2, '0')}`,
        value: x.subscriptionsCount,
        percent: percents[idx],
      }));
    }

    return [];
  }, [tab, topPopular, activeByPlan, byMonth]);

  const renderChart = () => {
    if (!chartData.length) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Visual overview
        </Typography>
        <Stack spacing={1.5}>
          {chartData.map((item) => (
            <Box key={item.label}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography variant="body2">{item.label}</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {item.value}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={item.percent}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
        </Stack>
      </Box>
    );
  };

  const renderTable = () => {
    if (tab === 'activeByPlan' && activeByPlan.length) {
      return (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subscription</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Price</TableCell>
              <TableCell align="right">Active count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeByPlan.map((row) => (
              <TableRow key={`${row.subscriptionId}-${row.periodId}`}>
                <TableCell>{row.subscriptionName}</TableCell>
                <TableCell>{row.periodName}</TableCell>
                <TableCell>{row.finalPrice.toFixed(2)}</TableCell>
                <TableCell align="right">
                  {row.activeSubscriptionsCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tab === 'subscriptionsWithPlans' && subsWithPlans.length) {
      return (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subscription</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Base price</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Months</TableCell>
              <TableCell>Final price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subsWithPlans.map((row) => (
              <TableRow key={row.subscriptionPriceId}>
                <TableCell>{row.subscriptionName}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.basePrice.toFixed(2)}</TableCell>
                <TableCell>{row.periodName}</TableCell>
                <TableCell>{row.monthsCount}</TableCell>
                <TableCell>{row.finalPrice.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tab === 'topPopular' && topPopular.length) {
      return (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subscription</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Total subscriptions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topPopular.map((row) => (
              <TableRow key={row.subscriptionId}>
                <TableCell>{row.subscriptionName}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell align="right">
                  {row.totalSubscriptionsCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tab === 'byMonth' && byMonth.length) {
      return (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Year</TableCell>
              <TableCell>Month</TableCell>
              <TableCell align="right">Subscriptions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {byMonth.map((row) => (
              <TableRow key={`${row.year}-${row.month}`}>
                <TableCell>{row.year}</TableCell>
                <TableCell>{row.month}</TableCell>
                <TableCell align="right">{row.subscriptionsCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tab === 'userSubscriptions' && userSubs.length) {
      return (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subscription</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>Valid until</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userSubs.map((row) => (
              <TableRow key={row.userSubscriptionId}>
                <TableCell>{row.subscriptionName}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.periodName}</TableCell>
                <TableCell>{row.finalPrice.toFixed(2)}</TableCell>
                <TableCell>
                  {new Date(row.startDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {row.validUntil
                    ? new Date(row.validUntil).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return (
      <Typography variant="body2" color="text.secondary">
        No data for selected report.
      </Typography>
    );
  };

  const renderControls = () => {
    if (tab === 'topPopular') {
      return (
        <TextField
          label="Top N"
          type="number"
          size="small"
          value={topCount}
          onChange={(e) => setTopCount(Number(e.target.value) || 1)}
          sx={{ width: 120 }}
        />
      );
    }

    if (tab === 'byMonth') {
      return (
        <Stack direction="row" spacing={2}>
          <TextField
            label="From (YYYY-MM-DD)"
            size="small"
            value={periodFrom}
            onChange={(e) => setPeriodFrom(e.target.value)}
          />
          <TextField
            label="To (YYYY-MM-DD)"
            size="small"
            value={periodTo}
            onChange={(e) => setPeriodTo(e.target.value)}
          />
        </Stack>
      );
    }

    if (tab === 'userSubscriptions') {
      return (
        <TextField
          label="User ID"
          size="small"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          fullWidth
        />
      );
    }

    return null;
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        background: 'rgba(255,255,255,0.85)',
        boxShadow: '0 8px 32px rgba(126, 87, 194, 0.15)',
      }}
    >
      <CardContent>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ color: '#7E57C2', fontWeight: 700 }}
        >
          Reports
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Generate analytics reports and export them to CSV (Excel) or Word.
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2 }}
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab label="Active by plan" value="activeByPlan" />
          <Tab label="Subscriptions & plans" value="subscriptionsWithPlans" />
          <Tab label="Top popular" value="topPopular" />
          <Tab label="By month" value="byMonth" />
          <Tab label="By user" value="userSubscriptions" />
        </Tabs>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          gap={2}
        >
          <Box>{renderControls()}</Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => loadCurrentTab()}
              disabled={loading}
            >
              Refresh
            </Button>
            <TextField
              select
              size="small"
              label="Export"
              value=""
              onChange={(e) =>
                handleExport(e.target.value as ExportFormat)
              }
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="csv">CSV (Excel)</MenuItem>
              <MenuItem value="word">Word (.doc)</MenuItem>
            </TextField>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Box sx={{ overflowX: 'auto' }}>{renderTable()}</Box>

        {renderChart()}
      </CardContent>
    </Card>
  );
};

