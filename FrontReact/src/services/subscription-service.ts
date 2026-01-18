import api from './api';
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  GroupedSubscriptions,
  PagedResult,
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

  async getCategories(): Promise<string[]> {
    const response = await api.get<string[]>(
      `${API_BASE_URL}/Subscriptions/categories`
    );
    return response.data;
  },

  async getSubscriptionsPaged(
    page: number,
    pageSize: number,
    category?: string
  ): Promise<PagedResult<Subscription>> {
    const response = await api.get<PagedResult<Subscription>>(
      `${API_BASE_URL}/Subscriptions`,
      {
        params: {
          pageNumber: page,
          pageSize: pageSize,
          category: category,
        },
      }
    );
    return response.data;
  },

  async getSubscriptionsWithFilters(
    page: number,
    pageSize: number,
    category?: string,
    search?: string,
    orderBy?: string,
    descending?: boolean,
    minPrice?: number,
    maxPrice?: number,
    period?: string
  ): Promise<PagedResult<Subscription>> {
    const params: any = {
      pageNumber: page,
      pageSize: pageSize,
    };

    if (category) params.category = category;
    if (search) params.search = search;
    if (orderBy) params.orderBy = orderBy;
    if (descending !== undefined) params.descending = descending;
    if (minPrice !== undefined) params.minPrice = minPrice;
    if (maxPrice !== undefined) params.maxPrice = maxPrice;
    if (period) params.period = period;

    const response = await api.get<PagedResult<Subscription>>(
      `${API_BASE_URL}/Subscriptions`,
      { params }
    );
    return response.data;
  },
};
