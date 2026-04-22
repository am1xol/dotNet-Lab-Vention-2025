import React, { useEffect, useState } from 'react';
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
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import { reportService } from '../../services/report-service';
import {
  UserActivityByPeriod,
  SubscriptionsByPeriod,
  UserSubscriptionReportItem,
} from '../../types/report';
import { translations } from '../../i18n/translations';
import { formatDateShort } from '../../utils/date-utils';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  Document,
  Packer,
  Paragraph,
  Table as WordTable,
  TableCell as WordTableCell,
  TableRow as WordTableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'userActivityPeriod' | 'subscriptionsPeriod' | 'subscriberDetails';
type ExportFormat = 'excel' | 'word' | 'pdf';

interface AdminReportsPanelProps {
  currentUserEmail?: string;
}

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type CellAlign = 'left' | 'right' | 'center';
type ReportRow = UserActivityByPeriod | SubscriptionsByPeriod | UserSubscriptionReportItem;

interface ReportColumn {
  header: string;
  align?: CellAlign;
  value: (row: ReportRow) => string;
}

interface ExportPayload {
  filename: string;
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
}

let timesNewRomanBase64Promise: Promise<string> | null = null;

const loadTimesNewRomanBase64 = async (): Promise<string> => {
  if (!timesNewRomanBase64Promise) {
    timesNewRomanBase64Promise = fetch('/fonts/TimesNewRoman.ttf')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load TimesNewRoman.ttf: ${response.status}`);
        }

        const fontBlob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result;
            if (typeof dataUrl !== 'string') {
              reject(new Error('Failed to convert Times New Roman font to base64'));
              return;
            }

            const [, base64] = dataUrl.split(',');
            if (!base64) {
              reject(new Error('Invalid base64 data for Times New Roman font'));
              return;
            }

            resolve(base64);
          };
          reader.onerror = () => reject(reader.error ?? new Error('Failed to read Times New Roman font'));
          reader.readAsDataURL(fontBlob);
        });
      })
      .catch((error) => {
        timesNewRomanBase64Promise = null;
        throw error;
      });
  }

  return await timesNewRomanBase64Promise;
};

const registerTimesNewRomanFont = async (pdf: jsPDF): Promise<void> => {
  const base64Font = await loadTimesNewRomanBase64();
  pdf.addFileToVFS('TimesNewRoman.ttf', base64Font);
  pdf.addFont('TimesNewRoman.ttf', 'TimesNewRoman', 'normal');
};

const exportToExcel = async (filename: string, title: string, rows: ReportRow[], columns: ReportColumn[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  worksheet.columns = columns.map((column, index) => ({
    header: column.header,
    key: String(index),
    width: Math.max(14, column.header.length + 4),
  }));

  worksheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF4A148C' } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(1).height = 26;

  const headerRow = worksheet.getRow(2);
  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7E57C2' } };
    cell.alignment = { horizontal: column.align ?? 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1C4E9' } },
      left: { style: 'thin', color: { argb: 'FFD1C4E9' } },
      bottom: { style: 'thin', color: { argb: 'FFD1C4E9' } },
      right: { style: 'thin', color: { argb: 'FFD1C4E9' } },
    };
  });
  headerRow.height = 22;

  rows.forEach((row, rowIndex) => {
    const addedRow = worksheet.addRow(
      columns.reduce<Record<string, string>>((acc, column, index) => {
        acc[String(index)] = column.value(row);
        return acc;
      }, {})
    );

    addedRow.eachCell((cell, colNumber) => {
      const column = columns[colNumber - 1];
      cell.alignment = { horizontal: column.align ?? 'left', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFEDE7F6' } },
        left: { style: 'thin', color: { argb: 'FFEDE7F6' } },
        bottom: { style: 'thin', color: { argb: 'FFEDE7F6' } },
        right: { style: 'thin', color: { argb: 'FFEDE7F6' } },
      };
      if (rowIndex % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F5FF' } };
      }
    });
  });

  worksheet.views = [{ state: 'frozen', ySplit: 2 }];
  worksheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}.xlsx`);
};

const exportToWord = async (filename: string, title: string, rows: ReportRow[], columns: ReportColumn[]) => {
  const headerCells = columns.map(
    (column) =>
      new WordTableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: column.header, bold: true, color: 'FFFFFF' })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: '7E57C2' },
      })
  );

  const bodyRows = rows.map(
    (row) =>
      new WordTableRow({
        children: columns.map(
          (column) =>
            new WordTableCell({
              children: [
                new Paragraph({
                  text: column.value(row),
                  alignment:
                    column.align === 'right'
                      ? AlignmentType.RIGHT
                      : column.align === 'center'
                        ? AlignmentType.CENTER
                        : AlignmentType.LEFT,
                }),
              ],
            })
        ),
      })
  );

  const table = new WordTable({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new WordTableRow({ children: headerCells }), ...bodyRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'D1C4E9' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1C4E9' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'D1C4E9' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'D1C4E9' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'EDE7F6' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'EDE7F6' },
    },
  });

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 32, color: '4A148C' })],
            spacing: { after: 300 },
          }),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  saveAs(blob, `${filename}.docx`);
};

const exportToPdf = async (filename: string, title: string, rows: ReportRow[], columns: ReportColumn[]) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  let tableFont = 'helvetica';
  try {
    await registerTimesNewRomanFont(pdf);
    pdf.setFont('TimesNewRoman', 'normal');
    tableFont = 'TimesNewRoman';
  } catch (error) {
    console.warn('Times New Roman font registration failed, using fallback PDF font.', error);
  }

  pdf.setFontSize(16);
  pdf.text(title, 40, 40);

  autoTable(pdf, {
    startY: 56,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => column.value(row))),
    theme: 'grid',
    styles: {
      font: tableFont,
      fontSize: 9,
      cellPadding: 6,
      lineColor: [220, 220, 220],
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: [126, 87, 194],
      textColor: [255, 255, 255],
      fontStyle: 'normal',
    },
    alternateRowStyles: {
      fillColor: [248, 245, 255],
    },
  });

  pdf.save(`${filename}.pdf`);
};

export const AdminReportsPanel: React.FC<AdminReportsPanelProps> = ({ currentUserEmail }) => {
  const [tab, setTab] = useState<ReportType>('userActivityPeriod');
  const [loading, setLoading] = useState(false);

  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [userEmail, setUserEmail] = useState(currentUserEmail || '');

  const [userActivity, setUserActivity] = useState<UserActivityByPeriod[]>([]);
  const [subscriptionsByPeriod, setSubscriptionsByPeriod] = useState<SubscriptionsByPeriod[]>([]);
  const [subscriberDetails, setSubscriberDetails] = useState<UserSubscriptionReportItem[]>([]);

  const loadCurrentTab = async () => {
    try {
      setLoading(true);
      if (tab === 'userActivityPeriod') {
        setUserActivity(await reportService.getUserActivityByPeriod(periodFrom, periodTo));
      } else if (tab === 'subscriptionsPeriod') {
        setSubscriptionsByPeriod(await reportService.getSubscriptionsByPeriod(periodFrom, periodTo));
      } else if (userEmail.trim()) {
        setSubscriberDetails(await reportService.getSubscriberSubscriptions(userEmail.trim()));
      } else {
        setSubscriberDetails([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const getExportPayload = (): ExportPayload => {
    if (tab === 'userActivityPeriod') {
      return {
        filename: 'user-activity-period',
        title: 'Активность пользователей за период',
        rows: userActivity,
        columns: [
          { header: 'Email', value: (row) => (row as UserActivityByPeriod).email },
          {
            header: 'Имя',
            value: (row) => {
              const userRow = row as UserActivityByPeriod;
              return `${userRow.firstName} ${userRow.lastName}`.trim() || '-';
            },
          },
          { header: 'Платежей', align: 'right', value: (row) => String((row as UserActivityByPeriod).successfulPaymentsCount) },
          { header: 'Сумма', align: 'right', value: (row) => formatMoney((row as UserActivityByPeriod).totalSpent) },
          { header: 'Стартов подписок', align: 'right', value: (row) => String((row as UserActivityByPeriod).subscriptionsStartedCount) },
          { header: 'Отмен подписок', align: 'right', value: (row) => String((row as UserActivityByPeriod).subscriptionsCancelledCount) },
          {
            header: 'Последняя активность',
            value: (row) => {
              const value = (row as UserActivityByPeriod).lastActivityAt;
              return value ? formatDateShort(value) : '-';
            },
          },
        ],
      };
    }

    if (tab === 'subscriptionsPeriod') {
      return {
        filename: 'subscriptions-period',
        title: 'Подписки за период',
        rows: subscriptionsByPeriod,
        columns: [
          { header: 'Подписка', value: (row) => (row as SubscriptionsByPeriod).subscriptionName },
          { header: 'Период', value: (row) => (row as SubscriptionsByPeriod).periodName },
          { header: 'Новых', align: 'right', value: (row) => String((row as SubscriptionsByPeriod).newSubscriptionsCount) },
          { header: 'Активных', align: 'right', value: (row) => String((row as SubscriptionsByPeriod).activeSubscribersCount) },
          { header: 'Успешных платежей', align: 'right', value: (row) => String((row as SubscriptionsByPeriod).successfulPaymentsCount) },
          { header: 'Выручка', align: 'right', value: (row) => formatMoney((row as SubscriptionsByPeriod).revenue) },
        ],
      };
    }

    return {
      filename: 'subscriber-subscriptions-details',
      title: 'Детализация по подписчику',
      rows: subscriberDetails,
      columns: [
        { header: 'Подписка', value: (row) => (row as UserSubscriptionReportItem).subscriptionName },
        { header: 'Категория', value: (row) => (row as UserSubscriptionReportItem).category },
        { header: 'Период', value: (row) => (row as UserSubscriptionReportItem).periodName },
        { header: 'Цена', align: 'right', value: (row) => formatMoney((row as UserSubscriptionReportItem).finalPrice) },
        { header: 'Начало', value: (row) => formatDateShort((row as UserSubscriptionReportItem).startDate) },
        {
          header: 'Действует до',
          value: (row) => {
            const value = (row as UserSubscriptionReportItem).validUntil;
            return value ? formatDateShort(value) : '-';
          },
        },
        { header: 'Статус', value: (row) => ((row as UserSubscriptionReportItem).isActive ? 'Активна' : 'Неактивна') },
      ],
    };
  };

  const handleExport = async (format: ExportFormat) => {
    const { filename, title, rows, columns } = getExportPayload();
    if (!rows.length) return;

    if (format === 'excel') {
      await exportToExcel(filename, title, rows, columns);
      return;
    }

    if (format === 'word') {
      await exportToWord(filename, title, rows, columns);
      return;
    }

    await exportToPdf(filename, title, rows, columns);
  };

  const renderTable = () => {
    if (tab === 'userActivityPeriod' && userActivity.length) {
      return (
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.userEmail}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Имя</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Платежей</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Сумма</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Стартов подписок</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Отмен подписок</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Последняя активность</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userActivity.map((row) => (
              <TableRow key={row.userId} hover>
                <TableCell>{row.email}</TableCell>
                <TableCell>{`${row.firstName} ${row.lastName}`.trim() || '-'}</TableCell>
                <TableCell align="right">{row.successfulPaymentsCount}</TableCell>
                <TableCell align="right">{formatMoney(row.totalSpent)}</TableCell>
                <TableCell align="right">{row.subscriptionsStartedCount}</TableCell>
                <TableCell align="right">{row.subscriptionsCancelledCount}</TableCell>
                <TableCell>{row.lastActivityAt ? formatDateShort(row.lastActivityAt) : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tab === 'subscriptionsPeriod' && subscriptionsByPeriod.length) {
      return (
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.subscription}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{translations.admin.period}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Новых</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Активных</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Успешных платежей</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Выручка</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptionsByPeriod.map((row) => (
              <TableRow key={`${row.subscriptionId}-${row.periodId}`} hover>
                <TableCell>{row.subscriptionName}</TableCell>
                <TableCell>{row.periodName}</TableCell>
                <TableCell align="right">{row.newSubscriptionsCount}</TableCell>
                <TableCell align="right">{row.activeSubscribersCount}</TableCell>
                <TableCell align="right">{row.successfulPaymentsCount}</TableCell>
                <TableCell align="right">{formatMoney(row.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tab === 'subscriberDetails' && subscriberDetails.length) {
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
            {subscriberDetails.map((row) => (
              <TableRow key={row.userSubscriptionId} hover>
                <TableCell>{row.subscriptionName}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.periodName}</TableCell>
                <TableCell>{formatMoney(row.finalPrice)}</TableCell>
                <TableCell>{formatDateShort(row.startDate)}</TableCell>
                <TableCell>{row.validUntil ? formatDateShort(row.validUntil) : '-'}</TableCell>
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

  return (
    <Card sx={{ borderRadius: 3, background: 'rgba(255,255,255,0.85)' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ color: '#7E57C2', fontWeight: 700 }}>
          {translations.admin.reportsTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {translations.admin.reportsSubtitle}
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable">
          <Tab label="Активность пользователей за период" value="userActivityPeriod" />
          <Tab label="Подписки за период" value="subscriptionsPeriod" />
          <Tab label="Детализация по подписчику" value="subscriberDetails" />
        </Tabs>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2} flexWrap="wrap">
          <Stack direction="row" spacing={2}>
            {tab !== 'subscriberDetails' ? (
              <>
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
              </>
            ) : (
              <TextField
                label={translations.admin.userEmail}
                size="small"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                sx={{ minWidth: 320 }}
              />
            )}
          </Stack>

          <Box display="flex" gap={1}>
            <Button variant="outlined" size="small" onClick={loadCurrentTab} disabled={loading}>
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
              <MenuItem value="excel">{translations.admin.csvExcel}</MenuItem>
              <MenuItem value="word">{translations.admin.wordDoc}</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </TextField>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        <Divider sx={{ mb: 2 }} />

        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', maxHeight: 500 }}>
          {renderTable()}
        </TableContainer>
      </CardContent>
    </Card>
  );
};