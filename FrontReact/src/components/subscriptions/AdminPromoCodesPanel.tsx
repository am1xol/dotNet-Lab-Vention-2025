import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { promoService } from '../../services/promo-service';
import { PromoAudienceUser, PromoCode, PromoCreateRequest, PromoDeliverySummary } from '../../types/promo';
import { translations } from '../../i18n/translations';

const defaultForm: PromoCreateRequest = {
  code: '',
  title: '',
  description: '',
  discountType: 1,
  discountValue: 10,
  maxDiscountAmount: undefined,
  validFrom: new Date().toISOString().slice(0, 16),
  validTo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  totalUsageLimit: undefined,
  perUserUsageLimit: 1,
  audienceType: 1,
  daysBack: 30,
  topUsersCount: 100,
};

export const AdminPromoCodesPanel: React.FC = () => {
  const [form, setForm] = useState<PromoCreateRequest>(defaultForm);
  const [previewUsers, setPreviewUsers] = useState<PromoAudienceUser[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  const [report, setReport] = useState<PromoDeliverySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPromos = async () => {
    const data = await promoService.getAdminPromos();
    setPromos(data);
    if (!selectedPromoId && data.length > 0) {
      setSelectedPromoId(data[0].id);
    }
  };

  useEffect(() => {
    loadPromos().catch((e) => setError(e.response?.data || 'Не удалось загрузить промокоды'));
  }, []);

  const handlePreview = async () => {
    setError(null);
    const users = await promoService.getAudiencePreview(
      form.audienceType,
      form.daysBack,
      form.topUsersCount
    );
    setPreviewUsers(users);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await promoService.createPromoCode(form);
      setSuccess(`Промокод создан и отправлен: ${result.assignedUsersCount} пользователям`);
      setPreviewUsers(result.assignedAccounts);
      setForm({ ...defaultForm, validFrom: form.validFrom, validTo: form.validTo });
      await loadPromos();
    } catch (e: any) {
      setError(e.response?.data || 'Не удалось создать промокод');
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    if (!selectedPromoId) return;
    setError(null);
    try {
      const data = await promoService.getDeliveryReport(selectedPromoId);
      setReport(data);
    } catch (e: any) {
      setError(e.response?.data || 'Не удалось загрузить отчет');
    }
  };

  useEffect(() => {
    if (selectedPromoId) {
      loadReport();
    }
  }, [selectedPromoId]);

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Создание промокода и выбор аудитории
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Код" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} fullWidth />
              <TextField label="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
            </Stack>
            <TextField label="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Тип скидки</InputLabel>
                <Select
                  value={form.discountType}
                  label="Тип скидки"
                  onChange={(e) => setForm({ ...form, discountType: Number(e.target.value) })}
                >
                  <MenuItem value={1}>Процент</MenuItem>
                  <MenuItem value={2}>Фиксированная сумма</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Значение скидки" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} fullWidth />
              <TextField label="Лимит на пользователя" type="number" value={form.perUserUsageLimit} onChange={(e) => setForm({ ...form, perUserUsageLimit: Number(e.target.value) })} fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Действует с" type="datetime-local" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Действует до" type="datetime-local" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Аудитория</InputLabel>
                <Select
                  value={form.audienceType}
                  label="Аудитория"
                  onChange={(e) => setForm({ ...form, audienceType: Number(e.target.value) })}
                >
                  <MenuItem value={1}>Покупали за последние N дней</MenuItem>
                  <MenuItem value={2}>Самые активные пользователи</MenuItem>
                  <MenuItem value={3}>Все пользователи с успешными оплатами</MenuItem>
                  <MenuItem value={4}>Не покупали &gt; N дней (реактивация)</MenuItem>
                </Select>
              </FormControl>
              <TextField label={translations.promo.daysBackLabel} type="number" value={form.daysBack} onChange={(e) => setForm({ ...form, daysBack: Number(e.target.value) })} fullWidth />
              <TextField label={translations.promo.topUsersLabel} type="number" value={form.topUsersCount} onChange={(e) => setForm({ ...form, topUsersCount: Number(e.target.value) })} fullWidth />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handlePreview}>Предпросмотр аудитории</Button>
              <Button variant="contained" onClick={handleCreate} disabled={loading}>Создать и отправить</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Предпросмотр получателей ({previewUsers.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{translations.promo.emailColumn}</TableCell>
                  <TableCell align="right">Оплат</TableCell>
                  <TableCell align="right">Потрачено</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewUsers.slice(0, 100).map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell>{u.email}</TableCell>
                    <TableCell align="right">{u.paymentsCount}</TableCell>
                    <TableCell align="right">{u.totalSpent.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Отчет по отправленным промокодам
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Промокод</InputLabel>
              <Select
                value={selectedPromoId}
                label="Промокод"
                onChange={(e) => setSelectedPromoId(e.target.value)}
              >
                {promos.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.code} - {p.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={loadReport}>Обновить отчет</Button>
          </Stack>

          {report && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">Отправлено: {report.assignedUsersCount}</Typography>
              <Typography variant="body2">Использовали: {report.usedUsersCount}</Typography>
              <Typography variant="body2">Всего применений: {report.totalUsagesCount}</Typography>
            </Box>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{translations.promo.emailColumn}</TableCell>
                  <TableCell>Назначено</TableCell>
                  <TableCell align="right">Использований</TableCell>
                  <TableCell align="right">Активен</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report?.accounts.map((a) => (
                  <TableRow key={a.userId}>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>{new Date(a.assignedAt).toLocaleString()}</TableCell>
                    <TableCell align="right">{a.userUsageCount}</TableCell>
                    <TableCell align="right">{a.isActive ? 'Да' : 'Нет'}</TableCell>
                  </TableRow>
                )) ?? null}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );
};
