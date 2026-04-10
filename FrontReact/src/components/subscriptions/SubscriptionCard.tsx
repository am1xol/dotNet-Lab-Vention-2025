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
  Collapse,
  Stack,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import DOMPurify from 'dompurify';
import { Subscription, SubscriptionPrice } from '../../types/subscription';
import { translations } from '../../i18n/translations';
import { formatDate } from '../../utils/date-utils';
import { FreezeSubscriptionDialog } from './FreezeSubscriptionDialog';
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
  frozenUntil?: string;
  canFreezeAndUnsubscribe?: boolean;
  canRestoreCancelled?: boolean;
  validUntil?: string;
  unsubscribeInfo?: { validUntil: string };
  onSubscribe: (id: string) => void;
  onInitiatePayment: (id: string) => Promise<void>;
  onUnsubscribe: (subscriptionId: string) => void;
  onFreeze?: (subscriptionId: string, freezeMonths: number) => Promise<void>;
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
  onRestoreCancelled,
  userRole,
  loading = false,
}) => {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
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

  const handleExpandToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

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
  const hasMarkdownContent = subscription.descriptionMarkdown?.trim().length > 0;
  const hasMultiplePrices = prices && prices.length > 0;
  const displayPrice = hasMultiplePrices ? null : (finalPrice ?? subscription.price);
  const displayPeriod = hasMultiplePrices ? null : periodName;

  const createMarkup = useMemo(() => (htmlContent: string) => ({
    __html: DOMPurify.sanitize(htmlContent),
  }), []);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        border: isCancelled
          ? '2px solid #ffd54f'
          : isFrozen
            ? '2px solid #90caf9'
            : '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(126, 87, 194, 0.1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 16px 40px rgba(126, 87, 194, 0.15)',
          border: isCancelled
            ? '2px solid #ffd54f'
            : isFrozen
              ? '2px solid #90caf9'
              : '1px solid rgba(126, 87, 194, 0.2)',
        },
      }}
    >
      {loading && <LinearProgress />}

      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box display="flex" alignItems="flex-start" mb={3}>
          {subscription.iconUrl ? (
            <Avatar
              src={subscription.iconUrl}
              sx={{ width: 60, height: 60, mr: 2 }}
              variant="rounded"
            />
          ) : (
            <Avatar
              sx={{
                width: 60,
                height: 60,
                mr: 2,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
              }}
              variant="rounded"
            >
              {subscription.name.charAt(0)}
            </Avatar>
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h5"
              component="h3"
              fontWeight="600"
              gutterBottom
            >
              {subscription.name}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={subscription.category}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={statusText}
                size="small"
                color={statusColor}
                variant={status === translations.subscriptions.active ? 'filled' : 'outlined'}
              />
            </Box>
          </Box>
        </Box>

        <Typography color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          {subscription.description}
        </Typography>

        {hasMarkdownContent && (
          <>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  mt: 2,
                  mb: 2,
                  p: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 1,
                  border: '1px solid rgba(0, 0, 0, 0.05)',
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
                    color: '#7E57C2',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  },
                  '& blockquote': {
                    borderLeft: '3px solid #ccc',
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
            </Collapse>

            <Button
              size="small"
              onClick={handleExpandToggle}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              sx={{
                color: 'primary.main',
                textTransform: 'none',
                fontWeight: 500,
                mb: 2,
              }}
            >
              {expanded ? translations.subscriptions.showLessDetails : translations.subscriptions.showMoreDetails}
            </Button>
          </>
        )}

        {!hasMultiplePrices && displayPrice !== null && (
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt="auto"
          >
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              <BynAmount amount={displayPrice} />
            </Typography>
            {displayPeriod && (
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight="500"
              >
                {displayPeriod}
              </Typography>
            )}
          </Box>
        )}

        {hasMultiplePrices && (
          <Box mt="auto">
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {translations.subscriptions.availablePlans}
            </Typography>
            <Stack spacing={1}>
              {prices.map((price) => (
                <Box
                  key={price.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'rgba(126, 87, 194, 0.05)',
                  }}
                >
                  <Typography variant="body2" fontWeight="500">
                    {price.periodName}
                  </Typography>
                  <Typography
                    variant="h6"
                    color="primary.main"
                    fontWeight="bold"
                  >
                    <BynAmount amount={price.finalPrice} />
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {isFrozen && frozenUntil && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: 'info.light',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'info.main',
              }}
            >
              <Typography variant="body2" color="info.dark" align="center">
                <strong>{translations.subscriptions.resumeSubscription}:</strong>{' '}
                {formatDateLocalized(frozenUntil)}
              </Typography>
            </Box>
          )}

        {!isFrozen &&
          status === translations.subscriptions.cancelled &&
          (unsubscribeInfo?.validUntil || validUntil) && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: 'warning.light',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'warning.main',
              }}
            >
              <Typography variant="body2" color="warning.dark" align="center">
                <strong>{translations.subscriptions.activeUntil}:</strong>{' '}
                {formatDateLocalized(unsubscribeInfo?.validUntil || validUntil || '')}
                <br />
                <Typography variant="caption">
                  {translations.subscriptions.youWillLoseAccess}
                </Typography>
              </Typography>
            </Box>
          )}
      </CardContent>

      <CardActions sx={{ p: 3, pt: 0 }}>
        {userRole === 'Admin' ? (
          <Box display="flex" gap={1} width="100%">
            <Button
              size="large"
              color="primary"
              variant="outlined"
              fullWidth
              disabled={loading}
            >
              {translations.subscriptions.edit}
            </Button>
            <Button
              size="large"
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
                size="large"
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => onRestoreCancelled(subscription.id)}
                disabled={finalLoadingState}
              >
                {translations.subscriptions.restoreSubscription}
              </Button>
            ) : isFrozen ? (
              <Tooltip title={translations.subscriptions.frozen} arrow>
                <span style={{ width: '100%' }}>
                  <Button
                    size="large"
                    variant="outlined"
                    color="info"
                    fullWidth
                    disabled
                  >
                    {translations.subscriptions.frozen}
                  </Button>
                </span>
              </Tooltip>
            ) : isCancelled ? (
              <Tooltip title={translations.subscriptions.subscriptionCancelled} arrow>
                <span style={{ width: '100%' }}>
                  <Button
                    size="large"
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
                    size="large"
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
                        size="large"
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
                      size="large"
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
                    {prices.map((price) => (
                      <Button
                        key={price.id}
                        size="large"
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
                        size="large"
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

      {onFreeze && (
        <FreezeSubscriptionDialog
          open={freezeDialogOpen}
          onClose={() => setFreezeDialogOpen(false)}
          onConfirm={async (freezeMonths) => {
            await onFreeze(subscription.id, freezeMonths);
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
