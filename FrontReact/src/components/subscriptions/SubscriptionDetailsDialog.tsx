import React, { useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DOMPurify from 'dompurify';
import { Subscription, SubscriptionPrice } from '../../types/subscription';
import { translations } from '../../i18n/translations';
import { BynAmount } from '../shared/BynAmount';

interface SubscriptionDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  subscription: Subscription;
  prices: SubscriptionPrice[];
}

export const SubscriptionDetailsDialog: React.FC<
  SubscriptionDetailsDialogProps
> = ({ open, onClose, subscription, prices }) => {
  const sortedPrices = useMemo(() => {
    if (!prices.length) return [];
    return [...prices].sort((a, b) => {
      const order = (m: number | undefined) =>
        typeof m === 'number' && m > 0 ? m : Number.POSITIVE_INFINITY;
      const d = order(a.monthsCount) - order(b.monthsCount);
      if (d !== 0) return d;
      return (a.periodName || '').localeCompare(b.periodName || '', 'ru', {
        sensitivity: 'base',
      });
    });
  }, [prices]);

  const createMarkup = useMemo(
    () => (html: string) => ({
      __html: DOMPurify.sanitize(html),
    }),
    []
  );

  const hasMarkdown = Boolean(subscription.descriptionMarkdown?.trim());

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      disableScrollLock
      aria-labelledby="subscription-details-title"
      PaperProps={{
        sx: {
          position: 'relative',
          overflow: 'hidden',
        },
      }}
    >
      <IconButton
        aria-label={translations.common.close}
        onClick={onClose}
        size="small"
        sx={(theme) => ({
          position: 'absolute',
          right: 4,
          top: 4,
          zIndex: theme.zIndex.modal + 2,
        })}
      >
        <CloseIcon />
      </IconButton>

      <DialogTitle
        id="subscription-details-title"
        sx={{
          pr: 6,
          pl: 2,
          pt: 2,
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight={600} component="span" sx={{ pr: 1 }}>
          {subscription.name}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {translations.subscriptions.category}:{' '}
          <strong>{subscription.category}</strong>
        </Typography>

        {subscription.description?.trim() && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {translations.subscriptions.shortDescription}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {subscription.description}
            </Typography>
          </Box>
        )}

        {hasMarkdown && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {translations.subscriptions.detailedDescription}
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                '& h1': {
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  mt: 1,
                  mb: 1,
                },
                '& h2': { fontSize: '1.1rem', fontWeight: 600, mt: 1, mb: 1 },
                '& h3': { fontSize: '1rem', fontWeight: 600, mt: 1, mb: 0.5 },
                '& p': { mb: 1, fontSize: '0.95rem' },
                '& ul, & ol': { pl: 2.5, mb: 1 },
                '& li': { mb: 0.5 },
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                },
                '& blockquote': {
                  borderLeft: '3px solid',
                  borderColor: 'divider',
                  pl: 2,
                  color: 'text.secondary',
                  my: 1,
                },
              }}
            >
              <div
                dangerouslySetInnerHTML={createMarkup(
                  subscription.descriptionMarkdown || ''
                )}
              />
            </Box>
          </Box>
        )}

        {sortedPrices.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {translations.subscriptions.availablePlans}
            </Typography>
            <Stack spacing={1}>
              {sortedPrices.map((price) => (
                <Box
                  key={price.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    py: 1,
                    px: 1.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(126, 87, 194, 0.06)',
                  }}
                >
                  <Typography variant="body1" fontWeight={500}>
                    {price.periodName}
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    <BynAmount amount={price.finalPrice} />
                  </Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}

        {!subscription.description?.trim() && !hasMarkdown && sortedPrices.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {translations.common.noData}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          {translations.common.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
