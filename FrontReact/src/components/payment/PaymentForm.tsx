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
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    if (
      !formData.expiryMonth ||
      !/^(0[1-9]|1[0-2])$/.test(formData.expiryMonth)
    ) {
      newErrors.expiryMonth = 'Please enter a valid month (01-12)';
    }

    if (!formData.expiryYear || !/^\d{4}$/.test(formData.expiryYear)) {
      newErrors.expiryYear = 'Please enter a valid year';
    }

    if (!formData.cvc || !/^\d{3,4}$/.test(formData.cvc)) {
      newErrors.cvc = 'Please enter a valid CVC';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter cardholder name';
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
            Payment Information
          </Typography>
          <Typography
            variant="subtitle1"
            component="div"
            color="text.secondary"
          >
            Subscribe to {subscriptionName} - ${price}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Cardholder Name"
                value={formData.cardholderName}
                onChange={handleInputChange('cardholderName')}
                error={!!errors.cardholderName}
                helperText={errors.cardholderName}
                placeholder="John Doe"
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Card Number"
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
                label="Expiry Month"
                value={formData.expiryMonth}
                onChange={handleInputChange('expiryMonth')}
                error={!!errors.expiryMonth}
                helperText={errors.expiryMonth}
                placeholder="MM"
                required
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Expiry Year"
                value={formData.expiryYear}
                onChange={handleInputChange('expiryYear')}
                error={!!errors.expiryYear}
                helperText={errors.expiryYear}
                placeholder="YYYY"
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="CVC"
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
            Cancel
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
            {loading ? 'Processing...' : 'Pay & Subscribe'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
