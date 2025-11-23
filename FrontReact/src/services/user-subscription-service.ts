import api from './api';
import {
  SubscribeResponse,
  GroupedUserSubscriptions,
} from '../types/subscription';

const API_BASE_URL = 'http://localhost:8081/api';

export const userSubscriptionService = {
  async subscribe(subscriptionId: string): Promise<SubscribeResponse> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/subscribe/${subscriptionId}`
    );
    return response.data as SubscribeResponse;
  },

  async getMySubscriptions(): Promise<GroupedUserSubscriptions> {
    const response = await api.get(
      `${API_BASE_URL}/UserSubscriptions/my-subscriptions`
    );
    return response.data as GroupedUserSubscriptions;
  },

  async unsubscribe(
    subscriptionId: string
  ): Promise<{ message: string; validUntil: string }> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/unsubscribe/${subscriptionId}`
    );
    return response.data as { message: string; validUntil: string };
  },
};
