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
  IconButton,
  Select,
  FormControl,
  InputLabel,
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
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{translations.admin.subscription}</TableCell>
              <TableCell>{translations.admin.plan}</TableCell>
              <TableCell>{translations.admin.price}</TableCell>
              <TableCell align="right">{translations.admin.activeCount}</TableCell>
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
              <TableCell>{translations.admin.subscription}</TableCell>
              <TableCell>{translations.admin.category}</TableCell>
              <TableCell>{translations.admin.basePrice}</TableCell>
              <TableCell>{translations.admin.period}</TableCell>
              <TableCell>{translations.admin.months}</TableCell>
              <TableCell>{translations.admin.finalPrice}</TableCell>
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
              <TableCell>{translations.admin.subscription}</TableCell>
              <TableCell>{translations.admin.category}</TableCell>
              <TableCell align="right">{translations.admin.totalSubscriptionsCount}</TableCell>
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
              <TableCell>{translations.admin.year}</TableCell>
              <TableCell>{translations.admin.month}</TableCell>
              <TableCell align="right">{translations.admin.subscriptionsCount}</TableCell>
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
              <TableCell>{translations.admin.subscription}</TableCell>
              <TableCell>{translations.admin.category}</TableCell>
              <TableCell>{translations.admin.period}</TableCell>
              <TableCell>{translations.admin.price}</TableCell>
              <TableCell>{translations.admin.start}</TableCell>
              <TableCell>{translations.admin.validUntil}</TableCell>
              <TableCell>{translations.admin.status}</TableCell>
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
                  {formatDateShort(row.startDate)}
                </TableCell>
                <TableCell>
                  {row.validUntil
                    ? formatDateShort(row.validUntil)
                    : '-'}
                </TableCell>
                <TableCell>{row.isActive ? translations.admin.activeStatus : translations.admin.inactiveStatus}</TableCell>
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
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab label={translations.admin.activeByPlan} value="activeByPlan" />
          <Tab label={translations.admin.subscriptionsPlans} value="subscriptionsWithPlans" />
          <Tab label={translations.admin.topPopular} value="topPopular" />
          <Tab label={translations.admin.byMonth} value="byMonth" />
          <Tab label={translations.admin.byUser} value="userSubscriptions" />
        </Tabs>

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

        <Box sx={{ overflowX: 'auto' }}>{renderTable()}</Box>

        <Box mt={2} display="flex" justifyContent="flex-end">
          {renderPagination()}
        </Box>

        {renderChart()}
      </CardContent>
    </Card>
  );
};