import React, { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notification-service';
import { useAuthStore } from '../../store/auth-store';
import { Notification } from '../../types/notification';
import { translations } from '../../i18n/translations';

const t = translations.notifications;

export const NotificationWatcher: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const shownIds = useRef<Set<string>>(new Set());

  const POLLING_INTERVAL = 10000;

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkForNewNotifications = async () => {
      try {
        const data = await notificationService.getUserNotifications(1, 50);
        const unreadOnes = data.items.filter(
          (n: Notification) => !n.isRead && !shownIds.current.has(n.id)
        );

        if (unreadOnes.length > 0) {
          const handleSnackbarClick = () => navigate('/profile');

          enqueueSnackbar(
            unreadOnes.length === 1
              ? t.newNotification
              : t.youHaveNewNotifications.replace('{count}', String(unreadOnes.length)),
            {
              variant: 'info',
              anchorOrigin: { vertical: 'top', horizontal: 'right' },
              autoHideDuration: 5000,
              SnackbarProps: {
                onClick: handleSnackbarClick,
                style: {
                  cursor: 'pointer',
                },
              },
            }
          );

          unreadOnes.forEach((n: Notification) => shownIds.current.add(n.id));
        }
      } catch (error) {
        console.error('Error checking notifications', error);
      }
    };

    checkForNewNotifications();
    const intervalId = setInterval(checkForNewNotifications, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, enqueueSnackbar, navigate]);

  return null;
};
