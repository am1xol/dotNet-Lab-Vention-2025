import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
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
import { subscriptionService } from '../../services/subscription-service';
import { subscriptionPriceService } from '../../services/subscription-price-service';
import { Period, Subscription } from '../../types/subscription';
import {
  PromoAudienceUser,
  PromoCode,
  PromoConditionRequest,
  PromoCreateRequest,
  PromoDeliverySummary,
} from '../../types/promo';
import { translations } from '../../i18n/translations';
import { BynAmount } from '../shared/BynAmount';

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
  conditions: [{ subscriptionId: undefined, periodId: undefined, minAmount: undefined }],
};

export const AdminPromoCodesPanel: React.FC = () => {
  const [form, setForm] = useState<PromoCreateRequest>(defaultForm);
  const [previewUsers, setPreviewUsers] = useState<PromoAudienceUser[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  const [report, setReport] = useState<PromoDeliverySummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPromos = async () => {
    const data = await promoService.getAdminPromos();
    const uniquePromos = data.filter((promo, index, source) =>
      source.findIndex((candidate) => candidate.id === promo.id) === index
    );
    setPromos(uniquePromos);
    if (!selectedPromoId && uniquePromos.length > 0) {
      setSelectedPromoId(uniquePromos[0].id);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await loadPromos();

        const [subscriptionsResponse, periodsResponse] = await Promise.all([
          subscriptionService.getSubscriptionsForAdmin(),
          subscriptionPriceService.getPeriods(),
        ]);

        const allSubscriptions = Object.values(subscriptionsResponse).flat();
        setSubscriptions(allSubscriptions);
        setPeriods(periodsResponse);
      } catch (e: any) {
        setError(e.response?.data || 'Не удалось загрузить данные для промокодов');
      }
    };

    loadInitialData();
  }, []);

  const updateCondition = (index: number, value: PromoConditionRequest) => {
    const next = [...form.conditions];
    next[index] = value;
    setForm({ ...form, conditions: next });
  };

  const addCondition = () => {
    setForm({
      ...form,
      conditions: [...form.conditions, { subscriptionId: undefined, periodId: undefined, minAmount: undefined }],
    });
  };

  const removeCondition = (index: number) => {
    if (form.conditions.length === 1) {
      setForm({
        ...form,
        conditions: [{ subscriptionId: undefined, periodId: undefined, minAmount: undefined }],
      });
      return;
    }
    setForm({
      ...form,
      conditions: form.conditions.filter((_, i) => i !== index),
    });
  };

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
            Создание промокода
          </Typography>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              1. Основная информация
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Код" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} fullWidth />
              <TextField label="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
            </Stack>
            <TextField label="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              2. Параметры скидки
            </Typography>
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

            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" color="text.secondary">
                3. Условия применимости
              </Typography>
              <Button variant="outlined" onClick={addCondition}>Добавить условие</Button>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Если оставить подписку и период пустыми - промокод будет действовать для всех.
            </Typography>
            {form.conditions.map((condition, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={600}>Условие {index + 1}</Typography>
                      <Button color="error" onClick={() => removeCondition(index)}>Удалить</Button>
                    </Stack>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel>Подписка</InputLabel>
                        <Select
                          value={condition.subscriptionId ?? ''}
                          label="Подписка"
                          onChange={(e) =>
                            updateCondition(index, { ...condition, subscriptionId: e.target.value || undefined })
                          }
                        >
                          <MenuItem value="">Все подписки</MenuItem>
                          {subscriptions.map((s) => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel>Период</InputLabel>
                        <Select
                          value={condition.periodId ?? ''}
                          label="Период"
                          onChange={(e) =>
                            updateCondition(index, { ...condition, periodId: e.target.value || undefined })
                          }
                        >
                          <MenuItem value="">Все периоды</MenuItem>
                          {periods.map((p) => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        label="Мин. сумма заказа"
                        type="number"
                        value={condition.minAmount ?? ''}
                        onChange={(e) =>
                          updateCondition(index, {
                            ...condition,
                            minAmount: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                        fullWidth
                      />
                    </Stack>
                    {!condition.subscriptionId && !condition.periodId && (
                      <Chip label="Применимо ко всем подпискам и периодам" color="success" variant="outlined" />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              4. Аудитория рассылки
            </Typography>
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
                    <TableCell align="right"><BynAmount amount={u.totalSpent} /></TableCell>
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
