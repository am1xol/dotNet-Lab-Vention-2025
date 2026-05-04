import api from './api';
import { User } from '../types/auth';

const SUBSCRIPTIONS_API_BASE =
  import.meta.env.VITE_SUBSCRIPTIONS_API_URL + '/api';
import {
  UpdateProfileRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '../types/user';

export const userService = {
  async getProfile(): Promise<User> {
    const response = await api.get(`/me`);
    return response.data as User;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await api.put(`/profile`, data);
    return response.data as User;
  },

  async changePassword(
    data: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    const response = await api.put(`/change-password`, data);
    return response.data as ChangePasswordResponse;
  },

  async getAllUsers(
    page: number,
    size: number,
    search?: string
  ): Promise<{ items: User[]; totalCount: number }> {
    const response = await api.get('/all-users', {
      params: {
        pageNumber: page,
        pageSize: size,
        searchTerm: search,
      },
    });
    return response.data as { items: User[]; totalCount: number };
  },

  async getUsersBySubscription(
    subscriptionId: string,
    page: number,
    size: number,
    search?: string,
    activeOnly = true
  ): Promise<{ items: User[]; totalCount: number }> {
    const response = await api.get(`${SUBSCRIPTIONS_API_BASE}/admin/subscribed-users`, {
      params: {
        subscriptionId,
        pageNumber: page,
        pageSize: size,
        searchTerm: search || undefined,
        activeOnly,
      },
    });
    return response.data as { items: User[]; totalCount: number };
  },

  async blockUser(id: string): Promise<void> {
    await api.post(`/${id}/block`);
  },

  async unblockUser(id: string): Promise<void> {
    await api.post(`/${id}/unblock`);
  },
};
