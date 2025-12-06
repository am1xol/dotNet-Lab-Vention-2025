import api from './api';
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  GroupedSubscriptions,
} from '../types/subscription';

const SUBSCRIPTION_API_URL = import.meta.env.VITE_SUBSCRIPTION_API_URL;
if (!SUBSCRIPTION_API_URL) {
  throw new Error('VITE_SUBSCRIPTION_API_URL is not defined');
}

export const subscriptionService = {
  async getSubscriptions(): Promise<GroupedSubscriptions> {
    const response = await api.get(`${SUBSCRIPTION_API_URL}/Subscriptions`);
    return response.data as GroupedSubscriptions;
  },

  async getSubscription(id: string): Promise<Subscription> {
    const response = await api.get(`${SUBSCRIPTION_API_URL}/Subscriptions/${id}`);
    return response.data as Subscription;
  },

  async createSubscription(
    data: CreateSubscriptionRequest
  ): Promise<Subscription> {
    const response = await api.post(`${SUBSCRIPTION_API_URL}/Subscriptions`, data);
    return response.data as Subscription;
  },

  async updateSubscription(
    id: string,
    data: UpdateSubscriptionRequest
  ): Promise<void> {
    await api.put(`${SUBSCRIPTION_API_URL}/Subscriptions/${id}`, data);
  },

  async deleteSubscription(id: string): Promise<void> {
    try {
      await api.delete(`${SUBSCRIPTION_API_URL}/Subscriptions/${id}`);
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage =
          error.response.data?.message ||
          'Cannot delete subscription with active users';
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  async toggleSubscriptionActive(id: string, isActive: boolean): Promise<void> {
    await api.patch(`${SUBSCRIPTION_API_URL}/Subscriptions/${id}/active`, { isActive });
  },

  async getSubscriptionsForAdmin(): Promise<GroupedSubscriptions> {
    const response = await api.get(`${SUBSCRIPTION_API_URL}/Subscriptions/admin/all`);
    return response.data as GroupedSubscriptions;
  },
};
