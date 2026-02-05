import React, { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { notificationService } from '../../services/notification-service';
import { useAuthStore } from '../../store/auth-store';

export const NotificationWatcher: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const shownIds = useRef<Set<string>>(new Set());

  const POLLING_INTERVAL = 10000;

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkForNewNotifications = async () => {
      try {
        const notifications = await notificationService.getUserNotifications();
        const unreadOnes = notifications.filter(
          (n) => !n.isRead && !shownIds.current.has(n.id)
        );

        if (unreadOnes.length > 0) {
          enqueueSnackbar(
            `You have ${unreadOnes.length} new notification in your profile`,
            {
              variant: 'info',
              anchorOrigin: { vertical: 'top', horizontal: 'right' },
              autoHideDuration: 5000,
            }
          );

          unreadOnes.forEach((n) => shownIds.current.add(n.id));
        }
      } catch (error) {
        console.error('Error checking notifications', error);
      }
    };

    checkForNewNotifications();
    const intervalId = setInterval(checkForNewNotifications, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, enqueueSnackbar]);

  return null;
};
