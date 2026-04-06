import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { translations } from '../../i18n/translations';

interface FreezeSubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (freezeMonths: number) => void;
  subscriptionName: string;
  loading?: boolean;
}

export const FreezeSubscriptionDialog: React.FC<FreezeSubscriptionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  subscriptionName,
  loading = false,
}) => {
  const [months, setMonths] = useState(1);

  useEffect(() => {
    if (open) {
      setMonths(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{translations.subscriptions.freezeDialogTitle}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subscriptionName}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {translations.subscriptions.freezeDialogDescription}
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel id="freeze-months-label">
            {translations.subscriptions.freezeMonthsLabel}
          </InputLabel>
          <Select
            labelId="freeze-months-label"
            value={months}
            label={translations.subscriptions.freezeMonthsLabel}
            onChange={(e) => setMonths(Number(e.target.value))}
            disabled={loading}
          >
            {[1, 2, 3, 6, 12].map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {translations.common.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(months)}
          disabled={loading}
          color="primary"
        >
          {loading ? translations.common.loading : translations.subscriptions.freezeConfirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
