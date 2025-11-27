import api from './api';
import {
  SubscribeResponse,
  GroupedUserSubscriptions,
} from '../types/subscription';
import {
  SubscribeWithPaymentRequest,
  UserStatistics,
  Payment,
} from '../types/payment';

const API_BASE_URL = 'http://localhost:8081/api';

export const userSubscriptionService = {
  async subscribe(subscriptionId: string): Promise<SubscribeResponse> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/subscribe/${subscriptionId}`
    );
    return response.data as SubscribeResponse;
  },

  async subscribeWithPayment(
    data: SubscribeWithPaymentRequest
  ): Promise<SubscribeResponse> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/subscribe-with-payment`,
      data
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

  async getStatistics(): Promise<UserStatistics> {
    const response = await api.get(
      `${API_BASE_URL}/UserSubscriptions/statistics`
    );
    return response.data as UserStatistics;
  },

  async getPaymentHistory(): Promise<Payment[]> {
    const response = await api.get(
      `${API_BASE_URL}/UserSubscriptions/payment-history`
    );
    return response.data as Payment[];
  },
};
