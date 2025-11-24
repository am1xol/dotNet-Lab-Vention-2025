import React from 'react';
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
} from '@mui/material';
import { Subscription } from '../../types/subscription';

interface SubscriptionCardProps {
  subscription: Subscription;
  isSubscribed?: boolean;
  isCancelled?: boolean;
  validUntil?: string;
  unsubscribeInfo?: { validUntil: string };
  onSubscribe: (subscriptionId: string) => void;
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
  onSubscribe,
  onUnsubscribe,
  userRole,
  loading = false,
}) => {
  const formatPrice = (price: number) => {
    return `$${price}`;
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

  const buttonState = getButtonState();

  const handleButtonClick = () => {
    if (isSubscribed && !isCancelled) {
      onUnsubscribe(subscription.id);
    } else if (!isSubscribed) {
      onSubscribe(subscription.id);
    }
  };

  const status = getSubscriptionStatus();
  const statusText = getStatusText();
  const statusColor = getStatusColor();

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
            mb: 3,
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {subscription.description}
        </Typography>

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
                disabled={buttonState.disabled || loading}
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
  );
};
