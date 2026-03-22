import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';

interface UnsubscribeReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, customReason?: string) => void;
  subscriptionName: string;
  loading?: boolean;
}

const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Слишком дорого' },
  { value: 'not_using', label: 'Не использую подписку' },
  { value: 'found_alternative', label: 'Нашёл альтернативу' },
  { value: 'technical_issues', label: 'Технические проблемы' },
  { value: 'temporary', label: 'Беру перерыв' },
  { value: 'other', label: 'Другое' },
];

export const UnsubscribeReasonDialog: React.FC<UnsubscribeReasonDialogProps> = ({
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
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedReason) {
      setError('Пожалуйста, выберите причину отмены');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      setError('Пожалуйста, укажите причину отмены');
      return;
    }

    onConfirm(selectedReason, selectedReason === 'other' ? customReason : undefined);
    
    setTimeout(() => {
      setSelectedReason('');
      setCustomReason('');
      setError(null);
    }, 300);
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          pb: 1,
          '&.MuiDialogTitle-root': {
            fontWeight: 600,
          },
        }}
      >
        Отмена подписки
      </DialogTitle>
      
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Вы собираетесь отменить подписку на <strong>{subscriptionName}</strong>.
          <br />
          Пожалуйста, помогите нам улучшиться — укажите причину отмены.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <RadioGroup
          value={selectedReason}
          onChange={(e) => {
            setSelectedReason(e.target.value);
            setError(null);
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {CANCELLATION_REASONS.map((reason) => (
              <FormControlLabel
                key={reason.value}
                value={reason.value}
                control={<Radio />}
                label={reason.label}
                sx={{
                  m: 0,
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: selectedReason === reason.value ? 'primary.main' : 'divider',
                  backgroundColor: selectedReason === reason.value ? 'rgba(126, 87, 194, 0.05)' : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'rgba(126, 87, 194, 0.05)',
                  },
                }}
              />
            ))}
          </Box>
        </RadioGroup>

        {selectedReason === 'other' && (
          <TextField
            autoFocus
            margin="dense"
            label="Ваша причина"
            fullWidth
            variant="outlined"
            value={customReason}
            onChange={(e) => {
              setCustomReason(e.target.value);
              setError(null);
            }}
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          fullWidth
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          fullWidth
          disabled={loading || !selectedReason}
          sx={{ borderRadius: 2 }}
        >
          {loading ? 'Отмена...' : 'Отменить подписку'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
