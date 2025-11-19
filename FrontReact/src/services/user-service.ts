import api from './api';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest, ChangePasswordResponse } from '../types/user';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const response = await api.get(`/me`);
    return response.data as UserProfile;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.put(`/profile`, data);
    return response.data as UserProfile;
  },

  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const response = await api.put(`/change-password`, data);
    return response.data as ChangePasswordResponse;
  },
};