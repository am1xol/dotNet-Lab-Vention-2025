import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { PaymentInfo } from '../../types/payment';
import { translations } from '../../i18n/translations';
import { BynAmount } from '../shared/BynAmount';

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  onPaymentSubmit: (paymentInfo: PaymentInfo) => Promise<void>;
  subscriptionName: string;
  price: number;
  loading?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  open,
  onClose,
  onPaymentSubmit,
  subscriptionName,
  price,
  loading = false,
}) => {
  const [formData, setFormData] = useState<PaymentInfo>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    cardholderName: '',
  });
  const [errors, setErrors] = useState<Partial<PaymentInfo>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentInfo> = {};

    if (
      !formData.cardNumber ||
      !/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))
    ) {
      newErrors.cardNumber = translations.payments.invalidCardNumber;
    }

    if (
      !formData.expiryMonth ||
      !/^(0[1-9]|1[0-2])$/.test(formData.expiryMonth)
    ) {
      newErrors.expiryMonth = translations.payments.invalidMonth;
    }

    if (!formData.expiryYear || !/^\d{4}$/.test(formData.expiryYear)) {
      newErrors.expiryYear = translations.payments.invalidYear;
    }

    if (!formData.cvc || !/^\d{3,4}$/.test(formData.cvc)) {
      newErrors.cvc = translations.payments.invalidCvc;
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = translations.payments.enterCardholderName;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onPaymentSubmit(formData);
    }
  };

  const handleInputChange =
    (field: keyof PaymentInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      if (field === 'cardNumber') {
        value = value
          .replace(/\D/g, '')
          .replace(/(.{4})/g, '$1 ')
          .trim();
        if (value.length > 19) value = value.slice(0, 19);
      }

      if (field === 'expiryMonth') {
        value = value.replace(/\D/g, '');
        if (value.length > 2) value = value.slice(0, 2);
        if (value && parseInt(value) > 12) value = '12';
      }

      if (field === 'expiryYear') {
        value = value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
      }

      if (field === 'cvc') {
        value = value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
      }

      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleClose = () => {
    setFormData({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvc: '',
      cardholderName: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h5" component="div" fontWeight="bold">
            {translations.payments.paymentInformation}
          </Typography>
          <Typography
            variant="subtitle1"
            component="div"
            color="text.secondary"
          >
            {translations.payments.subscribeTo} {subscriptionName} - <BynAmount amount={price} />
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={translations.payments.cardHolder}
                value={formData.cardholderName}
                onChange={handleInputChange('cardholderName')}
                error={!!errors.cardholderName}
                helperText={errors.cardholderName}
                placeholder="Иван Иванов"
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={translations.payments.cardNumber}
                value={formData.cardNumber}
                onChange={handleInputChange('cardNumber')}
                error={!!errors.cardNumber}
                helperText={errors.cardNumber}
                placeholder="1234 5678 9012 3456"
                required
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label={translations.payments.expiryMonth}
                value={formData.expiryMonth}
                onChange={handleInputChange('expiryMonth')}
                error={!!errors.expiryMonth}
                helperText={errors.expiryMonth}
                placeholder={translations.payments.expiryMonthPlaceholder}
                required
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label={translations.payments.expiryYear}
                value={formData.expiryYear}
                onChange={handleInputChange('expiryYear')}
                error={!!errors.expiryYear}
                helperText={errors.expiryYear}
                placeholder={translations.payments.expiryYearPlaceholder}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={translations.payments.cvv}
                value={formData.cvc}
                onChange={handleInputChange('cvc')}
                error={!!errors.cvc}
                helperText={errors.cvc}
                placeholder="123"
                required
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            {translations.common.cancel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            sx={{
              background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              minWidth: 120,
            }}
          >
            {loading ? translations.payments.processing : translations.payments.payAndSubscribe}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
