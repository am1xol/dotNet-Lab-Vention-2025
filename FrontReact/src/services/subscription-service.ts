import api from './api';
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  GroupedSubscriptions,
  PagedResult,
} from '../types/subscription';

const API_BASE_URL = import.meta.env.VITE_SUBSCRIPTIONS_API_URL + '/api';

export interface CreateSubscriptionWithPriceRequest
  extends CreateSubscriptionRequest {
  periodId: string;
  finalPrice: number;
}

async function fetchAllSubscriptions(): Promise<Subscription[]> {
  const pageSize = 100;
  const all: Subscription[] = [];
  let pageNumber = 1;

  for (;;) {
    const response = await api.get<PagedResult<Subscription>>(`${API_BASE_URL}/Subscriptions`, {
      params: { pageNumber, pageSize },
    });
    const paged = response.data;
    const batch = paged.items ?? [];
    if (batch.length === 0) break;
    all.push(...batch);
    const total = paged.totalCount;
    if (total != null && all.length >= total) break;
    if (batch.length < pageSize) break;
    pageNumber += 1;
  }

  return all;
}

function groupSubscriptionsByCategory(items: Subscription[]): GroupedSubscriptions {
  const grouped: GroupedSubscriptions = {};
  for (const sub of items) {
    const cat = sub.category?.trim() || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(sub);
  }
  return grouped;
}

export const subscriptionService = {
  async getSubscriptions(): Promise<GroupedSubscriptions> {
    const items = await fetchAllSubscriptions();
    return groupSubscriptionsByCategory(items);
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

  async createSubscriptionWithPrice(
    data: CreateSubscriptionWithPriceRequest
  ): Promise<Subscription> {
    const response = await api.post<Subscription>(
      `${API_BASE_URL}/Subscriptions/with-price`,
      data
    );
    return response.data;
  },

  async getAllSubscriptionsInCategory(category: string): Promise<Subscription[]> {
    const pageSize = 100;
    const all: Subscription[] = [];
    let pageNumber = 1;

    for (;;) {
      const result = await this.getSubscriptionsWithFilters(
        pageNumber,
        pageSize,
        category,
        undefined,
        'name',
        false
      );
      const batch = result.items ?? [];
      if (batch.length === 0) break;
      all.push(...batch);
      const total = result.totalCount;
      if (total != null && all.length >= total) break;
      if (batch.length < pageSize) break;
      pageNumber += 1;
    }

    return all;
  },

  async getSubscriptionsWithFilters(
    page: number,
    pageSize: number,
    category?: string,
    search?: string,
    orderBy?: string,
    descending?: boolean,
    minPrice?: number,
    maxPrice?: number
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

    const response = await api.get<PagedResult<Subscription>>(
      `${API_BASE_URL}/Subscriptions`,
      { params }
    );
    return response.data;
  },
};
