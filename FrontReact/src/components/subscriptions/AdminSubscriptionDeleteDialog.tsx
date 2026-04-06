import React from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { Subscription } from '../../types/subscription';
import { translations } from '../../i18n/translations';

interface AdminSubscriptionDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onConfirmDelete: () => void;
}

export const AdminSubscriptionDeleteDialog: React.FC<
  AdminSubscriptionDeleteDialogProps
> = ({ open, onClose, subscription, onConfirmDelete }) => {
  const confirmationText = translations.admin.deleteSubscriptionConfirmText.replace(
    '{name}',
    subscription?.name ?? ''
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{translations.admin.deleteSubscriptionTitle}</DialogTitle>
      <DialogContent>
        <Typography>
          {confirmationText}
        </Typography>
        {subscription?.isActive && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {translations.admin.deleteSubscriptionActiveWarning}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{translations.common.cancel}</Button>
        <Button onClick={onConfirmDelete} variant="contained" color="error">
          {translations.admin.deletePermanently}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
