import React, { useState } from 'react';
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
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import DOMPurify from 'dompurify';
import { Subscription } from '../../types/subscription';

interface SubscriptionCardProps {
  subscription: Subscription;
  isSubscribed?: boolean;
  isCancelled?: boolean;
  validUntil?: string;
  unsubscribeInfo?: { validUntil: string };
  onSubscribe: (subscriptionId: string) => void;
  onInitiatePayment: (subscriptionId: string) => Promise<void>;
  onUnsubscribe: (subscriptionId: string) => void;
  userRole?: string;
  loading?: boolean;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  isSubscribed = false,
  isCancelled = false,
  validUntil,
  unsubscribeInfo,
  onInitiatePayment,
  onUnsubscribe,
  onSubscribe,
  userRole,
  loading = false,
}) => {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const formatPrice = (price: number) => {
    return `${price} BYN`;
  };

  const getPeriodColor = (period: string) => {
    switch (period.toLowerCase()) {
      case 'monthly':
        return 'primary';
      case 'yearly':
        return 'secondary';
      case 'lifetime':
        return 'success';
      case 'quarterly':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSubscriptionStatus = () => {
    if (isCancelled) {
      return 'Cancelled';
    }
    if (isSubscribed) {
      return 'Active';
    }
    return 'Available';
  };

  const getStatusColor = () => {
    const status = getSubscriptionStatus();
    switch (status) {
      case 'Active':
        return 'success';
      case 'Cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    const status = getSubscriptionStatus();
    if (status === 'Cancelled') {
      const untilDate = unsubscribeInfo?.validUntil || validUntil;
      if (untilDate) {
        return `Cancelled (until ${formatDate(untilDate)})`;
      }
      return 'Cancelled';
    }
    return status;
  };

  const getButtonText = () => {
    if (isCancelled) {
      const untilDate = unsubscribeInfo?.validUntil || validUntil;
      if (untilDate) {
        return `Cancels on ${formatDate(untilDate)}`;
      }
      return 'Cancelled';
    }
    if (isSubscribed) {
      return 'Unsubscribe';
    }
    return 'Subscribe Now';
  };

  const getButtonState = () => {
    if (isCancelled) {
      const untilDate = unsubscribeInfo?.validUntil || validUntil;
      return {
        disabled: true,
        variant: 'outlined' as const,
        color: 'inherit' as const,
        tooltip: untilDate
          ? `Your subscription will be active until ${formatDate(untilDate)}`
          : 'Your subscription has been cancelled',
      };
    }
    if (isSubscribed) {
      return {
        disabled: false,
        variant: 'outlined' as const,
        color: 'error' as const,
        tooltip: 'Cancel your subscription',
      };
    }
    return {
      disabled: false,
      variant: 'contained' as const,
      color: 'primary' as const,
      tooltip: 'Subscribe to this service',
    };
  };

  const handleInitiatePayment = async () => {
    setPaymentLoading(true);
    try {
      await onInitiatePayment(subscription.id);
    } catch (e) {
      console.error(e);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (isSubscribed) {
      onUnsubscribe(subscription.id);
    } else if (subscription.price > 0) {
      handleInitiatePayment();
    } else {
      onSubscribe(subscription.id);
    }
  };

  const finalLoadingState = loading || paymentLoading;
  const buttonState = getButtonState();
  const status = getSubscriptionStatus();
  const statusText = getStatusText();
  const statusColor = getStatusColor();

  const hasMarkdownContent =
    subscription.descriptionMarkdown &&
    subscription.descriptionMarkdown.trim().length > 0;

  const createMarkup = (htmlContent: string) => {
    return { __html: DOMPurify.sanitize(htmlContent) };
  };

  return (
    <>
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
            : '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(126, 87, 194, 0.1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 16px 40px rgba(126, 87, 194, 0.15)',
            border: isCancelled
              ? '2px solid #ffd54f'
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
                  label={subscription.period}
                  size="small"
                  color={getPeriodColor(subscription.period)}
                  variant="filled"
                />
                <Chip
                  label={statusText}
                  size="small"
                  color={statusColor}
                  variant={status === 'Active' ? 'filled' : 'outlined'}
                />
              </Box>
            </Box>
          </Box>

          <Typography
            color="text.secondary"
            sx={{
              mb: 2,
              lineHeight: 1.6,
            }}
          >
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
                    maxHeight: expanded ? 'none' : '200px',
                    overflow: 'hidden',
                    '& h1': {
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      mt: 1,
                      mb: 1,
                    },
                    '& h2': {
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      mt: 1,
                      mb: 1,
                    },
                    '& h3': {
                      fontSize: '1rem',
                      fontWeight: 600,
                      mt: 1,
                      mb: 0.5,
                    },
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
                onClick={() => setExpanded(!expanded)}
                endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                sx={{
                  color: 'primary.main',
                  textTransform: 'none',
                  fontWeight: 500,
                  mb: 2,
                }}
              >
                {expanded ? 'Show less details' : 'Show more details'}
              </Button>
            </>
          )}

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt="auto"
          >
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {formatPrice(subscription.price)}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              per {subscription.period.toLowerCase()}
            </Typography>
          </Box>

          {status === 'Cancelled' &&
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
                  <strong>Active until:</strong>{' '}
                  {formatDate(unsubscribeInfo?.validUntil || validUntil || '')}
                  <br />
                  <Typography variant="caption">
                    You will lose access after this date
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
                Edit
              </Button>
              <Button
                size="large"
                color="error"
                variant="outlined"
                fullWidth
                disabled={loading}
              >
                Delete
              </Button>
            </Box>
          ) : (
            <Tooltip title={buttonState.tooltip} arrow>
              <span style={{ width: '100%' }}>
                <Button
                  size="large"
                  variant={buttonState.variant}
                  color={buttonState.color}
                  fullWidth
                  onClick={handleButtonClick}
                  disabled={buttonState.disabled || finalLoadingState}
                  sx={
                    !isSubscribed
                      ? {
                          background:
                            'linear-gradient(135deg, #7E57C2 0%, #5C6BC0 100%)',
                          '&:hover': {
                            background:
                              'linear-gradient(135deg, #6A45B8 0%, #4A5ABD 100%)',
                          },
                        }
                      : {}
                  }
                >
                  {loading ? 'Processing...' : getButtonText()}
                </Button>
              </span>
            </Tooltip>
          )}
        </CardActions>
      </Card>
    </>
  );
};
