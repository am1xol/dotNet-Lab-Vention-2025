import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { PromoCodeValidationResult } from '../../types/payment';
import { userSubscriptionService } from '../../services/user-subscription-service';
import { BynAmount } from '../shared/BynAmount';

interface PromoCodeDialogProps {
  open: boolean;
  subscriptionPriceId: string | null;
  baseAmount: number;
  periodName?: string;
  onClose: () => void;
  onConfirm: (promoCode?: string) => Promise<void>;
}

export const PromoCodeDialog: React.FC<PromoCodeDialogProps> = ({
  open,
  subscriptionPriceId,
  baseAmount,
  periodName,
  onClose,
  onConfirm,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [validation, setValidation] = useState<PromoCodeValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isUiLocked, setIsUiLocked] = useState(false);

  const finalAmount = useMemo(() => validation?.finalAmount ?? baseAmount, [validation, baseAmount]);

  useEffect(() => {
    if (!isUiLocked) return;

    const preventNavigation = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', preventNavigation);
    return () => {
      window.removeEventListener('beforeunload', preventNavigation);
    };
  }, [isUiLocked]);

  useEffect(() => {
    return () => {
      setIsUiLocked(false);
    };
  }, []);

  const handleValidate = async () => {
    if (!subscriptionPriceId) return;
    if (!promoCode.trim()) {
      setValidation(null);
      setError('Введите промокод');
      return;
    }

    setIsChecking(true);
    setError(null);
    try {
      const result = await userSubscriptionService.validatePromoCode(subscriptionPriceId, promoCode.trim());
      setValidation(result);
    } catch (e: any) {
      setValidation(null);
      setError(e.response?.data || 'Не удалось проверить промокод');
    } finally {
      setIsChecking(false);
    }
  };

  const handleConfirm = async () => {
    setIsUiLocked(true);
    setIsPaying(true);
    setError(null);
    try {
      await onConfirm(validation?.promoCode ?? undefined);
      setPromoCode('');
      setValidation(null);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Не удалось инициировать оплату');
    } finally {
      setIsPaying(false);
      setIsUiLocked(false);
    }
  };

  const handleClose = () => {
    if (isChecking || isPaying) return;
    setPromoCode('');
    setValidation(null);
    setError(null);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        disableEscapeKeyDown={isPaying}
      >
        <DialogTitle>Оплата подписки {periodName ? `(${periodName})` : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Промокод"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Введите промокод"
              fullWidth
              disabled={isChecking || isPaying}
            />
            <Box>
              <Button
                variant="outlined"
                onClick={handleValidate}
                disabled={isChecking || isPaying || !subscriptionPriceId}
              >
                {isChecking ? <CircularProgress size={18} /> : 'Проверить промокод'}
              </Button>
            </Box>

            {validation && (
              <Alert severity="success">
                Промокод применен. Скидка: <BynAmount amount={validation.discountAmount} />
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
              <Typography variant="body2">Базовая стоимость: <BynAmount amount={baseAmount} /></Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                К оплате: <BynAmount amount={finalAmount} />
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isChecking || isPaying}>Отмена</Button>
          <Button variant="contained" onClick={handleConfirm} disabled={isChecking || isPaying || !subscriptionPriceId}>
            {isPaying ? <CircularProgress size={18} /> : 'Перейти к оплате'}
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop
        open={isUiLocked}
        sx={(theme) => ({
          color: '#fff',
          zIndex: theme.zIndex.modal + 1000,
          flexDirection: 'column',
          gap: 1.5,
        })}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body2">Инициализация формы оплаты...</Typography>
      </Backdrop>
    </>
  );
};
