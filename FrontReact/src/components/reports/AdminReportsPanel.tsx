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
  TableContainer,
  LinearProgress,
  Stack,
  IconButton,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  FirstPage,
} from '@mui/icons-material';
import { reportService } from '../../services/report-service';
import {
  ActiveSubscriptionsByPlan,
  SubscriptionWithPlans,
  TopPopularSubscription,
  SubscriptionsByMonth,
  UserSubscriptionReportItem,
} from '../../types/report';
import { translations } from '../../i18n/translations';
import { formatDateShort } from '../../utils/date-utils';

type ReportType =
  | 'activeByPlan'
  | 'subscriptionsWithPlans'
  | 'topPopular'
  | 'byMonth'
  | 'userSubscriptions';

type ExportFormat = 'csv' | 'word';

interface AdminReportsPanelProps {
  currentUserEmail?: string;
}

const normalizeForChart = (values: number[]) => {
  const max = Math.max(...values, 1);
  return values.map((v) => (v / max) * 100);
};

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  currentUserEmail,
}) => {
  const [tab, setTab] = useState<ReportType>('activeByPlan');
  const [loading, setLoading] = useState(false);

  const [activeByPlan, setActiveByPlan] = useState<ActiveSubscriptionsByPlan[]>([]);
  const [subsWithPlans, setSubsWithPlans] = useState<SubscriptionWithPlans[]>([]);
  const [topPopular, setTopPopular] = useState<TopPopularSubscription[]>([]);
  const [byMonth, setByMonth] = useState<SubscriptionsByMonth[]>([]);
  const [userSubs, setUserSubs] = useState<UserSubscriptionReportItem[]>([]);

  const [topCount, setTopCount] = useState(5);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [userEmail, setUserEmail] = useState(currentUserEmail || '');

  const [activePage, setActivePage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(50);

  const [subsPage, setSubsPage] = useState(1);
  const [subsPageSize, setSubsPageSize] = useState(50);

  const hasNextActive = activeByPlan.length === activePageSize;
  const hasNextSubs = subsWithPlans.length === subsPageSize;

  useEffect(() => {
    loadCurrentTab();
  }, [tab, activePage, activePageSize, subsPage, subsPageSize, topCount, periodFrom, periodTo, userEmail]);

  const loadCurrentTab = async () => {
    try {
      setLoading(true);
      switch (tab) {
        case 'activeByPlan':
          const activeData = await reportService.getActiveByPlan(activePage, activePageSize);
          setActiveByPlan(activeData);
          break;
        case 'subscriptionsWithPlans':
          const subsData = await reportService.getSubscriptionsWithPlans(subsPage, subsPageSize);
          setSubsWithPlans(subsData);
          break;
        case 'topPopular':
          const popularData = await reportService.getTopPopular(topCount);
          setTopPopular(popularData);
          break;
        case 'byMonth':
          const monthData = await reportService.getByMonth(periodFrom, periodTo);
          setByMonth(monthData);
          break;
        case 'userSubscriptions':
          if (userEmail) {
            const userData = await reportService.getUserSubscriptions(userEmail);
            setUserSubs(userData);
          } else {
            setUserSubs([]);
          }
          break;
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

  const overviewMetrics = useMemo(() => {
    if (tab === 'activeByPlan') {
      const totalActive = activeByPlan.reduce((sum, item) => sum + item.activeSubscriptionsCount, 0);
      const avgPrice = activeByPlan.length
        ? activeByPlan.reduce((sum, item) => sum + item.finalPrice, 0) / activeByPlan.length
        : 0;
      return [
        { label: translations.admin.rows, value: activeByPlan.length },
        { label: translations.admin.activeCount, value: totalActive },
        { label: translations.admin.price, value: formatMoney(avgPrice) },
      ];
    }

    if (tab === 'subscriptionsWithPlans') {
      const avgBase = subsWithPlans.length
        ? subsWithPlans.reduce((sum, item) => sum + item.basePrice, 0) / subsWithPlans.length
        : 0;
      const avgFinal = subsWithPlans.length
        ? subsWithPlans.reduce((sum, item) => sum + item.finalPrice, 0) / subsWithPlans.length
        : 0;
      return [
        { label: translations.admin.rows, value: subsWithPlans.length },
        { label: translations.admin.basePrice, value: formatMoney(avgBase) },
        { label: translations.admin.finalPrice, value: formatMoney(avgFinal) },
      ];
    }

    if (tab === 'topPopular') {
      const total = topPopular.reduce((sum, item) => sum + item.totalSubscriptionsCount, 0);
      return [
        { label: translations.admin.rows, value: topPopular.length },
        { label: translations.admin.totalSubscriptionsCount, value: total },
        { label: translations.admin.topN, value: topCount },
      ];
    }

    if (tab === 'byMonth') {
      const total = byMonth.reduce((sum, item) => sum + item.subscriptionsCount, 0);
      const peak = byMonth.reduce((max, item) => Math.max(max, item.subscriptionsCount), 0);
      return [
        { label: translations.admin.rows, value: byMonth.length },
        { label: translations.admin.subscriptionsCount, value: total },
        { label: translations.admin.activeCount, value: peak },
      ];
    }

    const activeCount = userSubs.filter((item) => item.isActive).length;
    return [
      { label: translations.admin.rows, value: userSubs.length },
      { label: translations.admin.activeStatus, value: activeCount },
      { label: translations.admin.inactiveStatus, value: userSubs.length - activeCount },
    ];
  }, [tab, activeByPlan, subsWithPlans, topPopular, byMonth, userSubs, topCount]);

  const renderChart = () => {
    if (!chartData.length) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {translations.admin.visualOverview}
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
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.subscription}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.plan}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.price}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">{translations.admin.activeCount}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeByPlan.map((row) => (
              <TableRow
                key={`${row.subscriptionId}-${row.periodId}`}
                hover
                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(126,87,194,0.04)' } }}
              >
                <TableCell>{row.subscriptionName}</TableCell>
                <TableCell>{row.periodName}</TableCell>
                <TableCell>{formatMoney(row.finalPrice)}</TableCell>
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
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.subscription}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.category}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.basePrice}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.period}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.months}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.finalPrice}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subsWithPlans.map((row) => (
              <TableRow
                key={row.subscriptionPriceId}
                hover
                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(126,87,194,0.04)' } }}
              >
                <TableCell>{row.subscriptionName}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{formatMoney(row.basePrice)}</TableCell>
                <TableCell>{row.periodName}</TableCell>
                <TableCell>{row.monthsCount}</TableCell>
                <TableCell>{formatMoney(row.finalPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tab === 'topPopular' && topPopular.length) {
      return (
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.subscription}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.category}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">{translations.admin.totalSubscriptionsCount}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topPopular.map((row, index) => (
              <TableRow
                key={row.subscriptionId}
                hover
                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(126,87,194,0.04)' } }}
              >
                <TableCell>{row.subscriptionName}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" color="secondary" label={`#${index + 1}`} />
                    <span>{row.category}</span>
                  </Stack>
                </TableCell>
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
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.year}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.month}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">{translations.admin.subscriptionsCount}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {byMonth.map((row) => (
              <TableRow
                key={`${row.year}-${row.month}`}
                hover
                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(126,87,194,0.04)' } }}
              >
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
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.subscription}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.category}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.period}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.price}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.start}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.validUntil}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.status}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userSubs.map((row) => (
              <TableRow
                key={row.userSubscriptionId}
                hover
                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(126,87,194,0.04)' } }}
              >
                <TableCell>{row.subscriptionName}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.periodName}</TableCell>
                <TableCell>{formatMoney(row.finalPrice)}</TableCell>
                <TableCell>
                  {formatDateShort(row.startDate)}
                </TableCell>
                <TableCell>
                  {row.validUntil
                    ? formatDateShort(row.validUntil)
                    : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.isActive ? translations.admin.activeStatus : translations.admin.inactiveStatus}
                    color={row.isActive ? 'success' : 'default'}
                    variant={row.isActive ? 'filled' : 'outlined'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return (
      <Typography variant="body2" color="text.secondary">
        {translations.admin.noDataForSelectedReport}
      </Typography>
    );
  };

  const renderPagination = () => {
    if (tab === 'activeByPlan') {
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            onClick={() => setActivePage(1)}
            disabled={activePage === 1}
          >
            <FirstPage />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setActivePage((p) => Math.max(1, p - 1))}
            disabled={activePage === 1}
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="body2">
            {translations.admin.page} {activePage}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setActivePage((p) => p + 1)}
            disabled={!hasNextActive}
          >
            <ChevronRight />
          </IconButton>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel id="active-page-size-label">{translations.admin.rows}</InputLabel>
            <Select
              labelId="active-page-size-label"
              value={activePageSize}
              label={translations.admin.rows}
              onChange={(e) => {
                setActivePageSize(Number(e.target.value));
                setActivePage(1);
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      );
    }

    if (tab === 'subscriptionsWithPlans') {
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            onClick={() => setSubsPage(1)}
            disabled={subsPage === 1}
          >
            <FirstPage />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setSubsPage((p) => Math.max(1, p - 1))}
            disabled={subsPage === 1}
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="body2">
            {translations.admin.page} {subsPage}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setSubsPage((p) => p + 1)}
            disabled={!hasNextSubs}
          >
            <ChevronRight />
          </IconButton>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel id="subs-page-size-label">{translations.admin.rows}</InputLabel>
            <Select
              labelId="subs-page-size-label"
              value={subsPageSize}
              label={translations.admin.rows}
              onChange={(e) => {
                setSubsPageSize(Number(e.target.value));
                setSubsPage(1);
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      );
    }

    return null;
  };

  const renderControls = () => {
    if (tab === 'topPopular') {
      return (
        <TextField
          label={translations.admin.topN}
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
            label={translations.admin.fromDate}
            size="small"
            value={periodFrom}
            onChange={(e) => setPeriodFrom(e.target.value)}
          />
          <TextField
            label={translations.admin.toDate}
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
          label={translations.admin.userEmail}
          size="small"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
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
          {translations.admin.reportsTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {translations.admin.reportsSubtitle}
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2 }}
          variant="scrollable"
          allowScrollButtonsMobile
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab label={translations.admin.activeByPlan} value="activeByPlan" />
          <Tab label={translations.admin.subscriptionsPlans} value="subscriptionsWithPlans" />
          <Tab label={translations.admin.topPopular} value="topPopular" />
          <Tab label={translations.admin.byMonth} value="byMonth" />
          <Tab label={translations.admin.byUser} value="userSubscriptions" />
        </Tabs>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2.5,
            mb: 2,
            borderColor: 'rgba(126,87,194,0.2)',
            backgroundColor: 'rgba(126,87,194,0.02)',
          }}
        >
          <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
            {overviewMetrics.map((metric) => (
              <Box
                key={metric.label}
                sx={{
                  minWidth: 130,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(126,87,194,0.16)',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#5E35B1', lineHeight: 1.2 }}>
                  {metric.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          gap={2}
          flexWrap="wrap"
        >
          <Box>{renderControls()}</Box>
          <Box display="flex" gap={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => loadCurrentTab()}
              disabled={loading}
            >
              {translations.admin.refresh}
            </Button>
            <TextField
              select
              size="small"
              label={translations.admin.export}
              value=""
              onChange={(e) => handleExport(e.target.value as ExportFormat)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="csv">{translations.admin.csvExcel}</MenuItem>
              <MenuItem value="word">{translations.admin.wordDoc}</MenuItem>
            </TextField>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        <Divider sx={{ mb: 2 }} />

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            overflowX: 'auto',
            maxHeight: 440,
            borderRadius: 2.5,
            borderColor: 'rgba(126,87,194,0.2)',
          }}
        >
          {renderTable()}
        </TableContainer>

        <Box mt={2} display="flex" justifyContent="flex-end">
          {renderPagination()}
        </Box>

        {renderChart()}
      </CardContent>
    </Card>
  );
};