import api from './api';
import {
  SubscribeResponse,
  GroupedUserSubscriptions,
} from '../types/subscription';
import { UserStatistics, PaymentInitiationResult } from '../types/payment';

const API_BASE_URL = import.meta.env.VITE_SUBSCRIPTIONS_API_URL + '/api';

export const userSubscriptionService = {
  async subscribe(subscriptionId: string): Promise<SubscribeResponse> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/subscribe/${subscriptionId}`
    );
    return response.data as SubscribeResponse;
  },

  async initiatePayment(
    subscriptionId: string
  ): Promise<PaymentInitiationResult> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/initiate-payment/${subscriptionId}`
    );
    return response.data as PaymentInitiationResult;
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

  async getAvailableSubscriptions(
    page: number,
    pageSize: number,
    orderBy: string = 'id'
  ) {
    const response = await api.get(
      `${API_BASE_URL}/Subscriptions?pageNumber=${page}&pageSize=${pageSize}&orderBy=${orderBy}`
    );
    return response.data;
  },

  async getPaymentHistory(page: number, pageSize: number) {
    const response = await api.get(
      `${API_BASE_URL}/UserSubscriptions/payment-history?pageNumber=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },
};
