import api from './api';
import {
  ActiveSubscriptionsByPlan,
  SubscriptionWithPlans,
  TopPopularSubscription,
  SubscriptionsByMonth,
  UserSubscriptionReportItem,
} from '../types/report';

const SUBSCRIPTIONS_API_BASE =
  import.meta.env.VITE_SUBSCRIPTIONS_API_URL + '/api/Reports';

export const reportService = {
  async getActiveByPlan(
    page: number = 1,
    pageSize: number = 50
  ): Promise<ActiveSubscriptionsByPlan[]> {
    const response = await api.get(`${SUBSCRIPTIONS_API_BASE}/active-by-plan`, {
      params: { page, pageSize },
    });
    return response.data as ActiveSubscriptionsByPlan[];
  },

  async getSubscriptionsWithPlans(
    page: number = 1,
    pageSize: number = 50
  ): Promise<SubscriptionWithPlans[]> {
    const response = await api.get(
      `${SUBSCRIPTIONS_API_BASE}/subscriptions-with-plans`,
      {
        params: { page, pageSize },
      }
    );
    return response.data as SubscriptionWithPlans[];
  },

  async getTopPopular(topCount: number = 10): Promise<TopPopularSubscription[]> {
    const response = await api.get(
      `${SUBSCRIPTIONS_API_BASE}/top-popular?topCount=${topCount}`
    );
    return response.data as TopPopularSubscription[];
  },

  async getByMonth(
    startDate?: string,
    endDate?: string
  ): Promise<SubscriptionsByMonth[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString();
    const url = query
      ? `${SUBSCRIPTIONS_API_BASE}/by-month?${query}`
      : `${SUBSCRIPTIONS_API_BASE}/by-month`;

    const response = await api.get(url);
    return response.data as SubscriptionsByMonth[];
  },

  async getUserSubscriptions(email: string): Promise<UserSubscriptionReportItem[]> {
    const response = await api.get(
      `${SUBSCRIPTIONS_API_BASE}/user-subscriptions`,
      {
        params: { email },
      }
    );
    return response.data as UserSubscriptionReportItem[];
  },
};