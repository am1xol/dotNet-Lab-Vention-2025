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
import { formatDateNumeric, formatDateShort } from '../../utils/date-utils';
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
  subtitle?: string;
}

interface ReportExportMeta {
  organizationName: string;
  reportNumber: string;
  formedAtDisplay: string;
  subtitle?: string;
}

const REPORT_DOC_KIND_LABEL = 'Документ: Отчёт';

const buildReportExportMeta = (subtitle?: string): ReportExportMeta => {
  const organizationName =
    import.meta.env.VITE_REPORT_ORGANIZATION_NAME?.trim() || 'SubMan';
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const reportNumber = `OT-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const formedAtDisplay = now.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return { organizationName, reportNumber, formedAtDisplay, subtitle };
};

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

const exportToExcel = async (
  filename: string,
  title: string,
  rows: ReportRow[],
  columns: ReportColumn[],
  meta: ReportExportMeta
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');
  const colCount = columns.length;

  columns.forEach((column, index) => {
    worksheet.getColumn(index + 1).width = Math.max(14, column.header.length + 4);
  });

  const mergeRowText = (
    rowIndex: number,
    text: string,
    font: Partial<ExcelJS.Font>,
    rowHeight?: number
  ) => {
    worksheet.mergeCells(rowIndex, 1, rowIndex, colCount);
    const cell = worksheet.getCell(rowIndex, 1);
    cell.value = text;
    cell.font = font;
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    if (rowHeight !== undefined) {
      worksheet.getRow(rowIndex).height = rowHeight;
    }
  };

  mergeRowText(1, meta.organizationName, { bold: true, size: 12, color: { argb: 'FF333333' } }, 22);
  mergeRowText(2, REPORT_DOC_KIND_LABEL, { size: 11 }, 18);
  mergeRowText(3, `Номер отчёта: ${meta.reportNumber}`, { size: 11 }, 18);
  mergeRowText(4, `Дата и время формирования: ${meta.formedAtDisplay}`, { size: 11 }, 18);
  worksheet.getRow(5).height = 10;

  mergeRowText(6, title, { bold: true, size: 16, color: { argb: 'FF4A148C' } }, 26);

  let headerRowIndex = 7;
  if (meta.subtitle) {
    mergeRowText(7, meta.subtitle, { italic: true, size: 11, color: { argb: 'FF555555' } }, 20);
    headerRowIndex = 8;
  }

  const headerRow = worksheet.getRow(headerRowIndex);
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
    const addedRow = worksheet.addRow(columns.map((column) => column.value(row)));

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

  worksheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];
  worksheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: colCount },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}.xlsx`);
};

const exportToWord = async (
  filename: string,
  title: string,
  rows: ReportRow[],
  columns: ReportColumn[],
  meta: ReportExportMeta
) => {
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

  const headingBlocks = [
    new Paragraph({
      children: [new TextRun({ text: meta.organizationName, bold: true, size: 28 })],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun(REPORT_DOC_KIND_LABEL)],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun(`Номер отчёта: ${meta.reportNumber}`)],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun(`Дата и время формирования: ${meta.formedAtDisplay}`)],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 32, color: '4A148C' })],
      spacing: { after: meta.subtitle ? 120 : 300 },
    }),
  ];

  if (meta.subtitle) {
    headingBlocks.push(
      new Paragraph({
        children: [new TextRun({ text: meta.subtitle, italics: true, size: 22 })],
        spacing: { after: 300 },
      })
    );
  }

  const document = new Document({
    sections: [
      {
        children: [...headingBlocks, table],
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  saveAs(blob, `${filename}.docx`);
};

const exportToPdf = async (
  filename: string,
  title: string,
  rows: ReportRow[],
  columns: ReportColumn[],
  meta: ReportExportMeta
) => {
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

  let cursorY = 36;
  const lineGap = 14;
  const marginX = 40;

  pdf.setFontSize(11);
  pdf.text(meta.organizationName, marginX, cursorY);
  cursorY += lineGap;
  pdf.text(REPORT_DOC_KIND_LABEL, marginX, cursorY);
  cursorY += lineGap;
  pdf.text(`Номер отчёта: ${meta.reportNumber}`, marginX, cursorY);
  cursorY += lineGap;
  pdf.text(`Дата и время формирования: ${meta.formedAtDisplay}`, marginX, cursorY);
  cursorY += lineGap + 4;

  if (meta.subtitle) {
    pdf.setFontSize(10);
    pdf.text(meta.subtitle, marginX, cursorY);
    cursorY += lineGap + 4;
  }

  pdf.setFontSize(16);
  pdf.text(title, marginX, cursorY);
  cursorY += 26;

  autoTable(pdf, {
    startY: cursorY + 8,
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
  const todayDate = new Date().toISOString().slice(0, 10);

  const [userActivity, setUserActivity] = useState<UserActivityByPeriod[]>([]);
  const [subscriptionsByPeriod, setSubscriptionsByPeriod] = useState<SubscriptionsByPeriod[]>([]);
  const [subscriberDetails, setSubscriberDetails] = useState<UserSubscriptionReportItem[]>([]);

  const periodFromError = Boolean(periodFrom) && periodFrom > todayDate;
  const periodToError = Boolean(periodFrom && periodTo) && periodTo < periodFrom;
  const isPeriodRangeValid = !periodFromError && !periodToError;
  const canRefreshPeriodReport = Boolean(periodFrom && periodTo) && isPeriodRangeValid;

  const loadCurrentTab = async () => {
    if (tab !== 'subscriberDetails' && !canRefreshPeriodReport) {
      return;
    }

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
  }, [tab]);

  const getExportPayload = (): ExportPayload => {
    if (tab === 'userActivityPeriod') {
      return {
        filename: 'user-activity-period',
        title: 'Активность пользователей за период',
        subtitle:
          periodFrom && periodTo
            ? `Период: ${formatDateNumeric(periodFrom)} — ${formatDateNumeric(periodTo)}`
            : undefined,
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
        subtitle:
          periodFrom && periodTo
            ? `Период: ${formatDateNumeric(periodFrom)} — ${formatDateNumeric(periodTo)}`
            : undefined,
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
      subtitle: userEmail.trim() ? `Подписчик: ${userEmail.trim()}` : undefined,
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
    const { filename, title, rows, columns, subtitle } = getExportPayload();
    if (!rows.length) return;

    const meta = buildReportExportMeta(subtitle);

    if (format === 'excel') {
      await exportToExcel(filename, title, rows, columns, meta);
      return;
    }

    if (format === 'word') {
      await exportToWord(filename, title, rows, columns, meta);
      return;
    }

    await exportToPdf(filename, title, rows, columns, meta);
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
                  type="date"
                  value={periodFrom}
                  onChange={(e) => {
                    const nextFrom = e.target.value;
                    setPeriodFrom(nextFrom);
                    if (periodTo && periodTo < nextFrom) {
                      setPeriodTo('');
                    }
                  }}
                  error={periodFromError}
                  helperText={periodFromError ? 'Дата начала не может быть позже сегодняшнего дня' : ' '}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { max: todayDate },
                  }}
                />
                <TextField
                  label={translations.admin.toDate}
                  size="small"
                  type="date"
                  value={periodTo}
                  onChange={(e) => setPeriodTo(e.target.value)}
                  error={periodToError}
                  helperText={periodToError ? 'Дата окончания не может быть раньше даты начала' : ' '}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { min: periodFrom || undefined },
                  }}
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
            <Button
              variant="outlined"
              size="small"
              onClick={loadCurrentTab}
              disabled={loading || (tab !== 'subscriberDetails' && !canRefreshPeriodReport)}
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