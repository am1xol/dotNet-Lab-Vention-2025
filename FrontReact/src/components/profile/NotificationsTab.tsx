import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Stack,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Warning,
  MarkEmailRead,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRelativeTime } from '../../utils/date-utils';
import { Notification, NotificationType } from '../../types/notification';
import { notificationService } from '../../services/notification-service';
import { translations } from '../../i18n/translations';

interface NotificationsTabProps {
  onUnreadCountChanged?: () => Promise<void> | void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  onUnreadCountChanged,
}) => {
  type ReadFilter = 'all' | 'unread' | 'read';
  type TypeFilter = 'all' | NotificationType;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const pageSize = 5;

  useEffect(() => {
    initLoad();
  }, []);

  const initLoad = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getUserNotifications(1, pageSize);
      setNotifications(data.items);
      setTotalCount(data.totalCount);
      setPage(1);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await notificationService.getUserNotifications(
        nextPage,
        pageSize
      );

      setNotifications((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to load more notifications', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      await onUnreadCountChanged?.();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await onUnreadCountChanged?.();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const getIconByType = (type: NotificationType) => {
    switch (type) {
      case 'Success':
        return <CheckCircle color="success" />;
      case 'Error':
        return <ErrorIcon color="error" />;
      case 'Warning':
        return <Warning color="warning" />;
      default:
        return <Info color="info" />;
    }
  };

  const getBgColorByType = (type: NotificationType, isRead: boolean) => {
    if (isRead) return 'rgba(255, 255, 255, 0.6)';
    switch (type) {
      case 'Success':
        return 'rgba(237, 247, 237, 0.7)';
      case 'Error':
        return 'rgba(253, 237, 237, 0.7)';
      case 'Warning':
        return 'rgba(255, 244, 229, 0.7)';
      default:
        return 'rgba(229, 246, 253, 0.7)';
    }
  };

  const hasMore = notifications.length < totalCount;
  const filteredNotifications = notifications.filter((notification) => {
    const matchesReadStatus =
      readFilter === 'all' ||
      (readFilter === 'read' && notification.isRead) ||
      (readFilter === 'unread' && !notification.isRead);

    const matchesType =
      typeFilter === 'all' || notification.type === typeFilter;

    return matchesReadStatus && matchesType;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress sx={{ color: '#7E57C2' }} />
      </Box>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <NotificationsIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6">{translations.profile.noNotifications}</Typography>
        <Typography variant="body2">
          {translations.profile.noNotificationsDescription}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" color="#7E57C2" fontWeight="600">
          {translations.profile.notificationHistory} ({totalCount})
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<MarkEmailRead />}
            size="small"
            onClick={handleMarkAllRead}
            disabled={notifications.every((n) => n.isRead)}
            sx={{ color: '#7E57C2' }}
          >
            {translations.profile.readAll}
          </Button>
          <Button size="small" onClick={initLoad} sx={{ color: '#7E57C2' }}>
            {translations.common.refresh}
          </Button>
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 2 }}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <ToggleButtonGroup
          value={readFilter}
          exclusive
          onChange={(_, value: ReadFilter | null) =>
            value && setReadFilter(value)
          }
          size="small"
          color="secondary"
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value="all">
            {translations.profile.filterAllNotifications}
          </ToggleButton>
          <ToggleButton value="unread">
            {translations.profile.filterUnreadNotifications}
          </ToggleButton>
          <ToggleButton value="read">
            {translations.profile.filterReadNotifications}
          </ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={(_, value: TypeFilter | null) =>
            value && setTypeFilter(value)
          }
          size="small"
          color="secondary"
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value="all">{translations.profile.filterTypeAll}</ToggleButton>
          <ToggleButton value="Info">Info</ToggleButton>
          <ToggleButton value="Success">Success</ToggleButton>
          <ToggleButton value="Warning">Warning</ToggleButton>
          <ToggleButton value="Error">Error</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <AnimatePresence>
          {filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: notification.isRead
                    ? 'rgba(0,0,0,0.05)'
                    : 'rgba(126, 87, 194, 0.3)',
                  bgcolor: getBgColorByType(
                    notification.type,
                    notification.isRead
                  ),
                  transition: 'all 0.2s',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                }}
              >
                <ListItem
                  alignItems="flex-start"
                  disablePadding
                  secondaryAction={
                    !notification.isRead && (
                      <Tooltip title={translations.profile.markAsRead}>
                        <IconButton
                          edge="end"
                          onClick={() => handleMarkAsRead(notification.id)}
                          sx={{ color: '#7E57C2' }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <Box sx={{ mr: 2, mt: 0.5 }}>
                    {getIconByType(notification.type)}
                  </Box>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={notification.isRead ? 400 : 700}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.isRead && (
                          <Chip
                            label={translations.profile.new}
                            size="small"
                            color="secondary"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ mb: 1, display: 'block' }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeTime(notification.createdAt, true)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </Paper>
            </motion.div>
          ))}
        </AnimatePresence>
      </List>

      {notifications.length > 0 && filteredNotifications.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
          <Typography variant="body1">
            {translations.profile.noNotificationsByFilter}
          </Typography>
        </Box>
      )}

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loadingMore}
            sx={{
              color: '#7E57C2',
              borderColor: '#7E57C2',
              px: 4,
              '&:hover': {
                borderColor: '#5E35B1',
                bgcolor: 'rgba(126, 87, 194, 0.04)',
              },
            }}
          >
            {loadingMore ? (
              <CircularProgress size={24} sx={{ color: '#7E57C2' }} />
            ) : (
              translations.common.loadMore
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
};
