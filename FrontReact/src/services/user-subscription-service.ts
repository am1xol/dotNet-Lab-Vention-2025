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

const SUBSCRIPTION_API_URL = import.meta.env.VITE_SUBSCRIPTION_API_URL;
if (!SUBSCRIPTION_API_URL) {
  throw new Error('VITE_SUBSCRIPTION_API_URL is not defined');
}

export const userSubscriptionService = {
  async subscribe(subscriptionId: string): Promise<SubscribeResponse> {
    const response = await api.post(
      `${SUBSCRIPTION_API_URL}/UserSubscriptions/subscribe/${subscriptionId}`
    );
    return response.data as SubscribeResponse;
  },

  async subscribeWithPayment(
    data: SubscribeWithPaymentRequest
  ): Promise<SubscribeResponse> {
    const response = await api.post(
      `${SUBSCRIPTION_API_URL}/UserSubscriptions/subscribe-with-payment`,
      data
    );
    return response.data as SubscribeResponse;
  },

  async getMySubscriptions(): Promise<GroupedUserSubscriptions> {
    const response = await api.get(
      `${SUBSCRIPTION_API_URL}/UserSubscriptions/my-subscriptions`
    );
    return response.data as GroupedUserSubscriptions;
  },

  async unsubscribe(
    subscriptionId: string
  ): Promise<{ message: string; validUntil: string }> {
    const response = await api.post(
      `${SUBSCRIPTION_API_URL}/UserSubscriptions/unsubscribe/${subscriptionId}`
    );
    return response.data as { message: string; validUntil: string };
  },

  async getStatistics(): Promise<UserStatistics> {
    const response = await api.get(
      `${SUBSCRIPTION_API_URL}/UserSubscriptions/statistics`
    );
    return response.data as UserStatistics;
  },

  async getPaymentHistory(): Promise<Payment[]> {
    const response = await api.get(
      `${SUBSCRIPTION_API_URL}/UserSubscriptions/payment-history`
    );
    return response.data as Payment[];
  },
};
