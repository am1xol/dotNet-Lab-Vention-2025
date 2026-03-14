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
  async getActiveByPlan(): Promise<ActiveSubscriptionsByPlan[]> {
    const response = await api.get(`${SUBSCRIPTIONS_API_BASE}/active-by-plan`);
    return response.data as ActiveSubscriptionsByPlan[];
  },

  async getSubscriptionsWithPlans(): Promise<SubscriptionWithPlans[]> {
    const response = await api.get(
      `${SUBSCRIPTIONS_API_BASE}/subscriptions-with-plans`
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

  async getUserSubscriptions(userId: string): Promise<UserSubscriptionReportItem[]> {
    const response = await api.get(
      `${SUBSCRIPTIONS_API_BASE}/user-subscriptions?userId=${userId}`
    );
    return response.data as UserSubscriptionReportItem[];
  },
};

