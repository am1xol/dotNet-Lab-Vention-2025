import React, { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { notificationRealtimeService } from '../../services/notification-realtime-service';
import { useAuthStore } from '../../store/auth-store';
import { Notification } from '../../types/notification';
import { translations } from '../../i18n/translations';

const t = translations.notifications;

export const NotificationWatcher: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const shownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribeCreated = notificationRealtimeService.onNotificationCreated(
      (notification: Notification) => {
        if (notification.isRead || shownIds.current.has(notification.id)) {
          return;
        }

        const handleSnackbarClick = () => navigate('/profile');
        enqueueSnackbar(t.newNotification, {
          variant: 'info',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
          autoHideDuration: 5000,
          SnackbarProps: {
            onClick: handleSnackbarClick,
            style: {
              cursor: 'pointer',
            },
          },
        });

        shownIds.current.add(notification.id);
      }
    );

    return () => {
      unsubscribeCreated();
    };
  }, [isAuthenticated, enqueueSnackbar, navigate]);

  return null;
};
