import api from './api';
import { User } from '../types/auth';
import {
  UpdateProfileRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '../types/user';

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL;
if (!AUTH_API_URL) {
  throw new Error('VITE_AUTH_API_URL is not defined');
}

export const userService = {
  async getProfile(): Promise<User> {
    const response = await api.get(`${AUTH_API_URL}/me`);
    return response.data as User;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await api.put(`${AUTH_API_URL}/profile`, data);
    return response.data as User;
  },

  async changePassword(
    data: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    const response = await api.put(`${AUTH_API_URL}/change-password`, data);
    return response.data as ChangePasswordResponse;
  },
};
