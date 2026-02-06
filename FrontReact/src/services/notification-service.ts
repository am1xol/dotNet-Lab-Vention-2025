import api from './api';
import { Notification } from '../types/notification';

const SUBS_API_URL = import.meta.env.VITE_SUBSCRIPTIONS_API_URL;

export interface PagedNotifications {
  items: Notification[];
  totalCount: number;
}

export const notificationService = {
  async getUserNotifications(
    page: number = 1,
    pageSize: number = 5
  ): Promise<PagedNotifications> {
    const response = await api.get<PagedNotifications>('/api/Notifications', {
      baseURL: SUBS_API_URL,
      params: { page, pageSize },
    });
    return response.data;
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
