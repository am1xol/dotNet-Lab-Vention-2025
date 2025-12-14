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

interface AdminSubscriptionDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onConfirmDelete: () => void;
}

export const AdminSubscriptionDeleteDialog: React.FC<
  AdminSubscriptionDeleteDialogProps
> = ({ open, onClose, subscription, onConfirmDelete }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Subscription</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to permanently delete "
          <Typography component="span" fontWeight="bold">
            {subscription?.name}
          </Typography>
          "? This action will remove the subscription from the system.
        </Typography>
        {subscription?.isActive && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Note: This subscription is currently active and may have active
            users.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirmDelete} variant="contained" color="error">
          Delete Permanently
        </Button>
      </DialogActions>
    </Dialog>
  );
};
