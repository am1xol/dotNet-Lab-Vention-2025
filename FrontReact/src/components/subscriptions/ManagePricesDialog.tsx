import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import {
  subscriptionPriceService,
  CreateSubscriptionPriceRequest,
} from '../../services/subscription-price-service';
import {
  Period,
  Subscription,
  SubscriptionPrice,
} from '../../types/subscription';
import { translations } from '../../i18n/translations';
import { BynAmount } from '../shared/BynAmount';

interface ManagePricesDialogProps {
  open: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onSuccess: () => void;
}

export const ManagePricesDialog: React.FC<ManagePricesDialogProps> = ({
  open,
  onClose,
  subscription,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [prices, setPrices] = useState<SubscriptionPrice[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [newPrice, setNewPrice] = useState<number>(0);

  useEffect(() => {
    if (!open || !subscription) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [periodsData, pricesData] = await Promise.all([
          subscriptionPriceService.getPeriods(),
          subscriptionPriceService.getPrices(subscription.id),
        ]);
        setPeriods(periodsData);
        setPrices(pricesData);
      } catch (err: any) {
        setError(err.message || translations.subscriptions.failedToLoadData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, subscription]);

  useEffect(() => {
    if (!selectedPeriodId || !subscription) return;
    const period = periods.find((p) => p.id === selectedPeriodId);
    if (period) {
      const suggestedPrice = subscription.price * period.monthsCount;
      setNewPrice(suggestedPrice);
    }
  }, [selectedPeriodId, periods, subscription]);

  const handleAddPrice = async () => {
    if (!subscription || !selectedPeriodId || newPrice <= 0) return;

    setLoading(true);
    setError(null);
    try {
      const request: CreateSubscriptionPriceRequest = {
        subscriptionId: subscription.id,
        periodId: selectedPeriodId,
        finalPrice: newPrice,
      };
      await subscriptionPriceService.createPrice(request);
      const updatedPrices = await subscriptionPriceService.getPrices(
        subscription.id
      );
      setPrices(updatedPrices);
      setSelectedPeriodId('');
      setNewPrice(0);
    } catch (err: any) {
      setError(err.message || translations.subscriptions.failedToAddPrice);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!subscription) return;

    setLoading(true);
    setError(null);
    try {
      await subscriptionPriceService.deletePrice(priceId);
      const updatedPrices = await subscriptionPriceService.getPrices(
        subscription.id
      );
      setPrices(updatedPrices);
    } catch (err: any) {
      setError(err.message || translations.subscriptions.failedToDeletePrice);
    } finally {
      setLoading(false);
    }
  };

  const availablePeriods = periods.filter(
    (period) => !prices.some((p) => p.periodId === period.id)
  );

  if (!subscription) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {translations.subscriptions.managePricesFor} "{subscription.name}"
        <Typography variant="subtitle2" color="text.secondary">
          {translations.subscriptions.basePricePerMonth}: <BynAmount amount={subscription.price} />
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && prices.length === 0 && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Список существующих цен */}
        {prices.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {translations.subscriptions.existingPrices}
            </Typography>
            <List>
              {prices.map((price) => {
                const period = periods.find((p) => p.id === price.periodId);
                return (
                  <ListItem
                    key={price.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label={translations.subscriptions.deletePriceAriaLabel}
                        onClick={() => handleDeletePrice(price.id)}
                        disabled={loading}
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={period?.name || price.periodName}
                      secondary={<BynAmount amount={price.finalPrice} />}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}

        {/* Форма добавления новой цены */}
        {availablePeriods.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {translations.subscriptions.addNewPrice}
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{translations.subscriptions.period}</InputLabel>
                  <Select
                    value={selectedPeriodId}
                    onChange={(e) => setSelectedPeriodId(e.target.value)}
                    label={translations.subscriptions.period}
                  >
                    {availablePeriods.map((period) => (
                      <MenuItem key={period.id} value={period.id}>
                        {period.name} ({period.monthsCount} мес.)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={translations.subscriptions.finalPrice}
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddPrice}
                  disabled={loading || !selectedPeriodId || newPrice <= 0}
                >
                  {translations.subscriptions.add}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {availablePeriods.length === 0 && prices.length > 0 && (
          <Typography color="text.secondary" align="center" sx={{ mt: 2 }}>
            {translations.subscriptions.allPeriodsConfigured}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {translations.subscriptions.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
