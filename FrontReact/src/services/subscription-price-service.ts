import api from './api';
import { Period, SubscriptionPrice } from '../types/subscription';

const API_BASE_URL = import.meta.env.VITE_SUBSCRIPTIONS_API_URL + '/api';

export interface CreateSubscriptionPriceRequest {
  subscriptionId: string;
  periodId: string;
  finalPrice: number;
}

export const subscriptionPriceService = {
  async getPeriods(): Promise<Period[]> {
    const response = await api.get<Period[]>(
      `${API_BASE_URL}/SubscriptionPrices/periods`
    );
    return response.data;
  },

  async getPrices(subscriptionId: string): Promise<SubscriptionPrice[]> {
    const response = await api.get<SubscriptionPrice[]>(
      `${API_BASE_URL}/SubscriptionPrices`,
      {
        params: { subscriptionId },
      }
    );
    return response.data;
  },

  async createPrice(
    data: CreateSubscriptionPriceRequest
  ): Promise<SubscriptionPrice> {
    const response = await api.post<SubscriptionPrice>(
      `${API_BASE_URL}/SubscriptionPrices`,
      data
    );
    return response.data;
  },

  async deletePrice(id: string): Promise<void> {
    await api.delete(`${API_BASE_URL}/SubscriptionPrices/${id}`);
  },
};
