import api from './api';
import { Notification } from '../types/notification';

const SUBS_API_URL = import.meta.env.VITE_SUBSCRIPTIONS_API_URL;

export const notificationService = {
  async getUserNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/api/Notifications', {
      baseURL: SUBS_API_URL,
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
};
