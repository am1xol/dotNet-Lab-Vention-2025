import api from './api';
import {
  AdminAnalyticsDashboard,
  UserActivityByPeriod,
  SubscriptionsByPeriod,
  UserSubscriptionReportItem,
} from '../types/report';

const SUBSCRIPTIONS_API_BASE =
  import.meta.env.VITE_SUBSCRIPTIONS_API_URL + '/api/Reports';

export const reportService = {
  async getUserActivityByPeriod(
    startDate?: string,
    endDate?: string
  ): Promise<UserActivityByPeriod[]> {
    const response = await api.get(`${SUBSCRIPTIONS_API_BASE}/user-activity-period`, {
      params: { startDate, endDate },
    });
    return response.data as UserActivityByPeriod[];
  },

  async getSubscriptionsByPeriod(
    startDate?: string,
    endDate?: string
  ): Promise<SubscriptionsByPeriod[]> {
    const response = await api.get(`${SUBSCRIPTIONS_API_BASE}/subscriptions-period`, {
      params: { startDate, endDate },
    });
    return response.data as SubscriptionsByPeriod[];
  },

  async getSubscriberSubscriptions(email: string): Promise<UserSubscriptionReportItem[]> {
    const response = await api.get(
      `${SUBSCRIPTIONS_API_BASE}/subscriber-subscriptions`,
      {
        params: { email },
      }
    );
    return response.data as UserSubscriptionReportItem[];
  },

  // Backward-compatible alias for existing usages.
  async getUserSubscriptions(email: string): Promise<UserSubscriptionReportItem[]> {
    return this.getSubscriberSubscriptions(email);
  },

  async getAnalyticsDashboard(
    periodDays: number = 30,
    expiringWithinDays: number = 7
  ): Promise<AdminAnalyticsDashboard> {
    const response = await api.get(`${SUBSCRIPTIONS_API_BASE}/analytics-dashboard`, {
      params: { periodDays, expiringWithinDays },
    });
    return response.data as AdminAnalyticsDashboard;
  },
};