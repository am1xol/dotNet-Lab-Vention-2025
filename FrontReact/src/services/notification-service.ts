import api from './api';
import { Notification, NotificationType } from '../types/notification';

const SUBS_API_URL = import.meta.env.VITE_SUBSCRIPTIONS_API_URL;

export interface PagedNotifications {
  items: Notification[];
  totalCount: number;
}

const normalizeNotificationType = (rawType: unknown): NotificationType => {
  if (rawType === 'Info' || rawType === 0 || rawType === '0') return 'Info';
  if (rawType === 'Warning' || rawType === 1 || rawType === '1') return 'Warning';
  if (rawType === 'Error' || rawType === 2 || rawType === '2') return 'Error';
  if (rawType === 'Success' || rawType === 3 || rawType === '3') return 'Success';
  return 'Info';
};

const normalizeNotification = (notification: Notification): Notification => ({
  ...notification,
  type: normalizeNotificationType(notification.type),
});

export const notificationService = {
  async getUserNotifications(
    page: number = 1,
    pageSize: number = 5
  ): Promise<PagedNotifications> {
    const response = await api.get<PagedNotifications>('/api/Notifications', {
      baseURL: SUBS_API_URL,
      params: { page, pageSize },
    });

    return {
      ...response.data,
      items: response.data.items.map(normalizeNotification),
    };
  },

  async markAsRead(id: string): Promise<void> {
    await api.post(
      `/api/Notifications/${id}/read`,
      {},
      {
        baseURL: SUBS_API_URL,
      }
    );
  },

  async markAllAsRead(): Promise<void> {
    await api.post(
      '/api/Notifications/read-all',
      {},
      {
        baseURL: SUBS_API_URL,
      }
    );
  },
};
