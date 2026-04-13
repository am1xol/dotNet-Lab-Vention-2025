import api from './api';
import {
  SubscribeResponse,
  GroupedUserSubscriptions,
  PagedResult,
  UserSubscription,
} from '../types/subscription';
import {
  UserStatistics,
  PaymentInitiationResult,
  PromoCodeInfo,
  PromoCodeValidationResult,
} from '../types/payment';

const API_BASE_URL = import.meta.env.VITE_SUBSCRIPTIONS_API_URL + '/api';

export const userSubscriptionService = {
  async subscribe(subscriptionId: string): Promise<SubscribeResponse> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/subscribe/${subscriptionId}`
    );
    return response.data as SubscribeResponse;
  },

  async initiatePayment(
    subscriptionId: string,
    promoCode?: string
  ): Promise<PaymentInitiationResult> {
    const encodedPromo = promoCode ? `?promoCode=${encodeURIComponent(promoCode)}` : '';
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/initiate-payment/${subscriptionId}${encodedPromo}`
    );
    return response.data as PaymentInitiationResult;
  },

  async validatePromoCode(
    subscriptionPriceId: string,
    promoCode: string
  ): Promise<PromoCodeValidationResult> {
    const response = await api.post(`${API_BASE_URL}/PromoCodes/validate`, {
      subscriptionPriceId,
      promoCode,
    });
    return response.data as PromoCodeValidationResult;
  },

  async getMyPromoCodes(): Promise<PromoCodeInfo[]> {
    const response = await api.get(`${API_BASE_URL}/PromoCodes/my`);
    return response.data as PromoCodeInfo[];
  },

  async getMySubscriptions(): Promise<GroupedUserSubscriptions> {
    const response = await api.get<PagedResult<UserSubscription>>(
      `${API_BASE_URL}/UserSubscriptions/my-subscriptions`
    );

    const items = response.data.items || [];

    const grouped = items.reduce(
      (acc: GroupedUserSubscriptions, us: UserSubscription) => {
        const category = us.subscription?.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(us);
        return acc;
      },
      {} as GroupedUserSubscriptions
    );

    return grouped;
  },

  async unsubscribe(
    subscriptionId: string,
    reason?: string,
    customReason?: string
  ): Promise<{ message: string; validUntil: string }> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/unsubscribe/${subscriptionId}`,
      { reason, customReason }
    );
    return response.data as { message: string; validUntil: string };
  },

  async freezeSubscription(subscriptionId: string): Promise<{
    message: string;
    frozenAt?: string;
    frozenUntil: string;
    nextBillingDate: string;
    validUntil?: string;
  }> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/freeze/${subscriptionId}`,
      {}
    );
    return response.data as {
      message: string;
      frozenAt?: string;
      frozenUntil: string;
      nextBillingDate: string;
      validUntil?: string;
    };
  },

  async resumeSubscription(subscriptionId: string): Promise<{
    message: string;
    nextBillingDate: string;
    validUntil?: string;
  }> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/resume/${subscriptionId}`
    );
    return response.data as {
      message: string;
      nextBillingDate: string;
      validUntil?: string;
    };
  },

  async restoreCancelledSubscription(subscriptionId: string): Promise<{
    message: string;
  }> {
    const response = await api.post(
      `${API_BASE_URL}/UserSubscriptions/restore-cancelled/${subscriptionId}`
    );
    return response.data as { message: string };
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

  async getSubscriptionHistory(page: number, pageSize: number) {
    const response = await api.get(
      `${API_BASE_URL}/UserSubscriptions/subscription-history?pageNumber=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },
};
