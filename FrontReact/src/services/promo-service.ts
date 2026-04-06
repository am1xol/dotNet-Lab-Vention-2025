import api from './api';
import {
  PromoAudienceUser,
  PromoCode,
  PromoCreateRequest,
  PromoCreateResult,
  PromoDeliverySummary,
} from '../types/promo';

const API_BASE_URL = import.meta.env.VITE_SUBSCRIPTIONS_API_URL + '/api/PromoCodes';

export const promoService = {
  async getAudiencePreview(
    audienceType: number,
    daysBack: number,
    topUsersCount: number
  ): Promise<PromoAudienceUser[]> {
    const response = await api.get(`${API_BASE_URL}/audience-preview`, {
      params: { audienceType, daysBack, topUsersCount },
    });
    return response.data as PromoAudienceUser[];
  },

  async createPromoCode(request: PromoCreateRequest): Promise<PromoCreateResult> {
    const response = await api.post(API_BASE_URL, request);
    return response.data as PromoCreateResult;
  },

  async getAdminPromos(): Promise<PromoCode[]> {
    const response = await api.get(`${API_BASE_URL}/admin`);
    return response.data as PromoCode[];
  },

  async getDeliveryReport(promoCodeId: string): Promise<PromoDeliverySummary> {
    const response = await api.get(`${API_BASE_URL}/${promoCodeId}/delivery-report`);
    return response.data as PromoDeliverySummary;
  },
};
