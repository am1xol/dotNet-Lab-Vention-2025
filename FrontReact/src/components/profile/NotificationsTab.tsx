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
import { formatDistanceToNow } from 'date-fns';
import { Notification, NotificationType } from '../../types/notification';
import { notificationService } from '../../services/notification-service';

export const NotificationsTab: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getUserNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark as read', error);
      loadNotifications();
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
        <Typography variant="h6">Уведомлений пока нет</Typography>
        <Typography variant="body2">
          Здесь будут отображаться новости о подписках и платежах
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
          История уведомлений
        </Typography>
        <Button
          startIcon={<MarkEmailRead />}
          size="small"
          onClick={loadNotifications}
          sx={{ color: '#7E57C2' }}
        >
          Обновить
        </Button>
      </Stack>

      <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <AnimatePresence>
          {notifications.map((notification) => (
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
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  },
                }}
              >
                <ListItem
                  alignItems="flex-start"
                  disablePadding
                  secondaryAction={
                    !notification.isRead && (
                      <Tooltip title="Отметить как прочитанное">
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
                            label="New"
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
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
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
    </Box>
  );
};
