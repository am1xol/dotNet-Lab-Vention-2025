import React, { useState, memo, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  LinearProgress,
  Tooltip,
  Stack,
  IconButton,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Subscription, SubscriptionPrice } from '../../types/subscription';
import { translations } from '../../i18n/translations';
import { formatDate } from '../../utils/date-utils';
import { FreezeSubscriptionDialog } from './FreezeSubscriptionDialog';
import { SubscriptionDetailsDialog } from './SubscriptionDetailsDialog';
import { BynAmount } from '../shared/BynAmount';

interface SubscriptionCardProps {
  subscription: Subscription;
  subscriptionPriceId?: string;
  periodName?: string;
  finalPrice?: number;
  prices?: SubscriptionPrice[];
  isSubscribed?: boolean;
  isCancelled?: boolean;
  isFrozen?: boolean;
  frozenAt?: string;
  frozenUntil?: string;
  canFreezeAndUnsubscribe?: boolean;
  canRestoreCancelled?: boolean;
  validUntil?: string;
  unsubscribeInfo?: { validUntil: string };
  onSubscribe: (id: string) => void;
  onInitiatePayment: (id: string) => Promise<void>;
  onUnsubscribe: (subscriptionId: string) => void;
  onFreeze?: (subscriptionId: string) => Promise<void>;
  onResume?: (subscriptionId: string) => Promise<void>;
  onRestoreCancelled?: (subscriptionId: string) => Promise<void>;
  userRole?: string;
  loading?: boolean;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  subscriptionPriceId,
  periodName,
  finalPrice,
  prices,
  isSubscribed = false,
  isCancelled = false,
  isFrozen = false,
  frozenUntil,
  canFreezeAndUnsubscribe = false,
  canRestoreCancelled = false,
  validUntil,
  unsubscribeInfo,
  onInitiatePayment,
  onUnsubscribe,
  onSubscribe,
  onFreeze,
  onResume,
  onRestoreCancelled,
  userRole,
  loading = false,
}) => {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);

  const handleInitiatePayment = useCallback(async (priceId: string) => {
    setPaymentLoading(true);
    try {
      await onInitiatePayment(priceId);
    } catch (e) {
      console.error(e);
    } finally {
      setPaymentLoading(false);
    }
  }, [onInitiatePayment]);

  const handleSubscribe = useCallback((id: string) => {
    onSubscribe(id);
  }, [onSubscribe]);

  const handleUnsubscribeClick = useCallback(() => {
    onUnsubscribe(subscription.id);
  }, [onUnsubscribe, subscription.id]);

  const formatDateLocalized = useMemo(() => (dateString: string | undefined) => {
    if (!dateString) return translations.common.noData;
    return formatDate(dateString);
  }, []);

  const status = useMemo(() => {
    if (isFrozen) return translations.subscriptions.frozen;
    if (isCancelled) return translations.subscriptions.cancelled;
    if (isSubscribed) return translations.subscriptions.active;
    return translations.subscriptions.available;
  }, [isCancelled, isSubscribed, isFrozen]);

  const statusColor = useMemo(() => {
    switch (status) {
      case translations.subscriptions.active: return 'success';
      case translations.subscriptions.cancelled: return 'warning';
      case translations.subscriptions.frozen: return 'info';
      default: return 'default';
    }
  }, [status]);

  const statusText = useMemo(() => {
    if (isFrozen && frozenUntil) {
      return `${translations.subscriptions.frozen} (${translations.subscriptions.until} ${formatDateLocalized(frozenUntil)})`;
    }
    if (status === translations.subscriptions.cancelled) {
      const untilDate = unsubscribeInfo?.validUntil || validUntil;
      return untilDate
        ? `${translations.subscriptions.cancelled} (${translations.subscriptions.until} ${formatDateLocalized(untilDate)})`
        : translations.subscriptions.cancelled;
    }
    return status;
  }, [status, isFrozen, frozenUntil, unsubscribeInfo?.validUntil, validUntil, formatDateLocalized]);

  const finalLoadingState = loading || paymentLoading;

  const sortedPrices = useMemo(() => {
    if (!prices?.length) return [];
    return [...prices].sort((a, b) => {
      const ma = a.monthsCount;
      const mb = b.monthsCount;
      const order = (x: number | undefined) =>
        typeof x === 'number' && x > 0 ? x : Number.POSITIVE_INFINITY;
      const d = order(ma) - order(mb);
      if (d !== 0) return d;
      return (a.periodName || '').localeCompare(b.periodName || '', 'ru', {
        sensitivity: 'base',
      });
    });
  }, [prices]);

  const hasMultiplePrices = sortedPrices.length > 0;
  const displayPrice = hasMultiplePrices ? null : (finalPrice ?? subscription.price);
  const displayPeriod = hasMultiplePrices ? null : periodName;

  const pricesForDetails = useMemo((): SubscriptionPrice[] => {
    if (sortedPrices.length > 0) return sortedPrices;
    const amount = finalPrice ?? subscription.price;
    if (amount == null || Number.isNaN(Number(amount))) return [];
    return [
      {
        id: `${subscription.id}-catalog-price`,
        subscriptionId: subscription.id,
        periodId: subscriptionPriceId || '',
        finalPrice: Number(amount),
        periodName: periodName || '—',
        monthsCount: 0,
      },
    ];
  }, [
    sortedPrices,
    subscription.id,
    subscription.price,
    finalPrice,
    periodName,
    subscriptionPriceId,
  ]);

  return (
    <Card
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        border: isCancelled
          ? '2px solid #ffd54f'
          : isFrozen
            ? '2px solid #90caf9'
            : '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(126, 87, 194, 0.08)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(126, 87, 194, 0.12)',
          border: isCancelled
            ? '2px solid #ffd54f'
            : isFrozen
              ? '2px solid #90caf9'
              : '1px solid rgba(126, 87, 194, 0.25)',
        },
      }}
    >
      <Tooltip
        title={translations.subscriptions.subscriptionDetailsCardHint}
        arrow
        enterTouchDelay={0}
        placement="left"
      >
        <IconButton
          size="small"
          aria-label={translations.subscriptions.subscriptionDetailsCardHint}
          onClick={(e) => {
            e.stopPropagation();
            setDetailsOpen(true);
          }}
          sx={{
            position: 'absolute',
            top: 6,
            right: 10,
            zIndex: 2,
            bgcolor: 'rgba(255, 255, 255, 0.92)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
          }}
        >
          <HelpOutlineIcon sx={{ fontSize: '1.15rem', color: 'primary.main' }} />
        </IconButton>
      </Tooltip>

      {loading && <LinearProgress />}

      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          p: 2,
          '&:last-child': { pb: 2 },
        }}
      >
        <Box
          onClick={() => setDetailsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setDetailsOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={translations.subscriptions.subscriptionDetails}
          sx={{
            cursor: 'pointer',
            borderRadius: 1,
            mx: -0.5,
            px: 0.5,
            pt: 0.5,
            pb: 0.5,
            flexShrink: 0,
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
        >
          <Box display="flex" alignItems="flex-start" mb={1}>
            {subscription.iconUrl ? (
              <Avatar
                src={subscription.iconUrl}
                sx={{ width: 48, height: 48, mr: 1.5, flexShrink: 0 }}
                variant="rounded"
              />
            ) : (
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  mr: 1.5,
                  flexShrink: 0,
                  bgcolor: 'primary.main',
                  fontSize: '1.25rem',
                }}
                variant="rounded"
              >
                {subscription.name.charAt(0)}
              </Avatar>
            )}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                component="h3"
                fontWeight={600}
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                  mb: 0.5,
                }}
              >
                {subscription.name}
              </Typography>
              <Box display="flex" gap={0.75} flexWrap="wrap" alignItems="center">
                <Chip
                  label={subscription.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{
                    maxWidth: '100%',
                    height: 24,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      px: 1,
                      fontSize: '0.7rem',
                    },
                  }}
                />
                <Tooltip title={statusText} arrow enterTouchDelay={0}>
                  <Chip
                    label={status}
                    size="small"
                    color={statusColor}
                    variant={status === translations.subscriptions.active ? 'filled' : 'outlined'}
                    sx={{ flexShrink: 0, height: 24, '& .MuiChip-label': { fontSize: '0.7rem', px: 1 } }}
                  />
                </Tooltip>
              </Box>
            </Box>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {subscription.description}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, minHeight: 4 }} />

        <Box sx={{ flexShrink: 0, width: '100%', mt: 'auto' }}>
          {!hasMultiplePrices && displayPrice !== null && (
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={1}
            >
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                <BynAmount amount={displayPrice} />
              </Typography>
              {displayPeriod && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={500}
                  sx={{ textAlign: 'right' }}
                >
                  {displayPeriod}
                </Typography>
              )}
            </Box>
          )}

          {hasMultiplePrices && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                {translations.subscriptions.availablePlans}
              </Typography>
              <Stack spacing={0.75}>
                {sortedPrices.map((price) => (
                  <Box
                    key={price.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      py: 0.75,
                      px: 1,
                      borderRadius: 1,
                      bgcolor: 'rgba(126, 87, 194, 0.05)',
                    }}
                  >
                    <Typography variant="body2" fontWeight={500} fontSize="0.8rem">
                      {price.periodName}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="primary.main"
                      fontWeight="bold"
                      fontSize="0.95rem"
                    >
                      <BynAmount amount={price.finalPrice} />
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {!isFrozen &&
            status === translations.subscriptions.cancelled &&
            (unsubscribeInfo?.validUntil || validUntil) && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1,
                  bgcolor: 'warning.light',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'warning.main',
                }}
              >
                <Typography variant="caption" color="warning.dark" align="center" display="block">
                  <strong>{translations.subscriptions.activeUntil}:</strong>{' '}
                  {formatDateLocalized(unsubscribeInfo?.validUntil || validUntil || '')}
                  <Typography variant="caption" component="span" display="block" sx={{ mt: 0.5 }}>
                    {translations.subscriptions.youWillLoseAccess}
                  </Typography>
                </Typography>
              </Box>
            )}
        </Box>
      </CardContent>

      <CardActions sx={{ p: 1.5, pt: 0, flexShrink: 0, mt: 'auto' }}>
        {userRole === 'Admin' ? (
          <Box display="flex" gap={1} width="100%">
            <Button
              size="medium"
              color="primary"
              variant="outlined"
              fullWidth
              disabled={loading}
            >
              {translations.subscriptions.edit}
            </Button>
            <Button
              size="medium"
              color="error"
              variant="outlined"
              fullWidth
              disabled={loading}
            >
              {translations.common.delete}
            </Button>
          </Box>
        ) : (
          <>
            {canRestoreCancelled && onRestoreCancelled ? (
              <Button
                size="medium"
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => onRestoreCancelled(subscription.id)}
                disabled={finalLoadingState}
              >
                {translations.subscriptions.restoreSubscription}
              </Button>
            ) : isFrozen ? (
              <Button
                size="medium"
                variant="outlined"
                color="info"
                fullWidth
                onClick={() => onResume?.(subscription.id)}
                disabled={finalLoadingState || !onResume}
              >
                {translations.subscriptions.resumeSubscription}
              </Button>
            ) : isCancelled ? (
              <Tooltip title={translations.subscriptions.subscriptionCancelled} arrow>
                <span style={{ width: '100%' }}>
                  <Button
                    size="medium"
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    disabled
                  >
                    {translations.subscriptions.cancelled}
                  </Button>
                </span>
              </Tooltip>
            ) : isSubscribed ? (
              canFreezeAndUnsubscribe && onFreeze ? (
                <Stack direction="row" spacing={1} width="100%">
                  <Button
                    size="medium"
                    variant="outlined"
                    color="info"
                    fullWidth
                    onClick={() => setFreezeDialogOpen(true)}
                    disabled={finalLoadingState}
                  >
                    {translations.subscriptions.freezeSubscription}
                  </Button>
                  <Tooltip title={translations.subscriptions.cancelSubscription} arrow>
                    <span style={{ flex: 1, width: '100%' }}>
                      <Button
                        size="medium"
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={handleUnsubscribeClick}
                        disabled={finalLoadingState}
                      >
                        {translations.subscriptions.unsubscribe}
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              ) : (
                <Tooltip title={translations.subscriptions.cancelSubscription} arrow>
                  <span style={{ width: '100%' }}>
                    <Button
                      size="medium"
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={handleUnsubscribeClick}
                      disabled={finalLoadingState}
                    >
                      {translations.subscriptions.unsubscribe}
                    </Button>
                  </span>
                </Tooltip>
              )
            ) : (
              <>
                {hasMultiplePrices ? (
                  <Stack direction="row" spacing={1} width="100%">
                    {sortedPrices.map((price) => (
                      <Button
                        key={price.id}
                        size="medium"
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => handleInitiatePayment(price.id)}
                        disabled={finalLoadingState}
                        sx={{
                          background:
                            'linear-gradient(135deg, #7E57C2 0%, #5C6BC0 100%)',
                          '&:hover': {
                            background:
                              'linear-gradient(135deg, #6A45B8 0%, #4A5ABD 100%)',
                          },
                        }}
                      >
                        {price.periodName}
                      </Button>
                    ))}
                  </Stack>
                ) : (
                  <Tooltip title={translations.subscriptions.subscribe} arrow>
                    <span style={{ width: '100%' }}>
                      <Button
                        size="medium"
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => {
                          const id = subscriptionPriceId || subscription.id;
                          if (subscription.price > 0) {
                            handleInitiatePayment(id);
                          } else {
                            handleSubscribe(id);
                          }
                        }}
                        disabled={finalLoadingState}
                        sx={{
                          background:
                            'linear-gradient(135deg, #7E57C2 0%, #5C6BC0 100%)',
                          '&:hover': {
                            background:
                              'linear-gradient(135deg, #6A45B8 0%, #4A5ABD 100%)',
                          },
                        }}
                      >
                        {translations.subscriptions.subscribeNow}
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </>
            )}
          </>
        )}
      </CardActions>

      <SubscriptionDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        subscription={subscription}
        prices={pricesForDetails}
      />

      {onFreeze && (
        <FreezeSubscriptionDialog
          open={freezeDialogOpen}
          onClose={() => setFreezeDialogOpen(false)}
          onConfirm={async () => {
            await onFreeze(subscription.id);
            setFreezeDialogOpen(false);
          }}
          subscriptionName={subscription.name}
          loading={finalLoadingState}
        />
      )}
    </Card>
  );
};

export default memo(SubscriptionCard);
