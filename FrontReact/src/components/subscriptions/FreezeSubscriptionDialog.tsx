import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { translations } from '../../i18n/translations';

interface FreezeSubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
  useEffect(() => {
    if (open) {
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {translations.common.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          color="primary"
        >
          {loading ? translations.common.loading : translations.subscriptions.freezeConfirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
