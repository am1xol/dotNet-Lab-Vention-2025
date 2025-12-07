import api from './api';
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  GroupedSubscriptions,
} from '../types/subscription';

const API_BASE_URL = import.meta.env.VITE_SUBSCRIPTIONS_API_URL + '/api';

export const subscriptionService = {
  async getSubscriptions(): Promise<GroupedSubscriptions> {
    const response = await api.get(`${API_BASE_URL}/Subscriptions`);
    return response.data as GroupedSubscriptions;
  },

  async getSubscription(id: string): Promise<Subscription> {
    const response = await api.get(`${API_BASE_URL}/Subscriptions/${id}`);
    return response.data as Subscription;
  },

  async createSubscription(
    data: CreateSubscriptionRequest
  ): Promise<Subscription> {
    const response = await api.post(`${API_BASE_URL}/Subscriptions`, data);
    return response.data as Subscription;
  },

  async updateSubscription(
    id: string,
    data: UpdateSubscriptionRequest
  ): Promise<void> {
    await api.put(`${API_BASE_URL}/Subscriptions/${id}`, data);
  },

  async deleteSubscription(id: string): Promise<void> {
    try {
      await api.delete(`${API_BASE_URL}/Subscriptions/${id}`);
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
    await api.patch(`${API_BASE_URL}/Subscriptions/${id}/active`, { isActive });
  },

  async getSubscriptionsForAdmin(): Promise<GroupedSubscriptions> {
    const response = await api.get(`${API_BASE_URL}/Subscriptions/admin/all`);
    return response.data as GroupedSubscriptions;
  },
};
