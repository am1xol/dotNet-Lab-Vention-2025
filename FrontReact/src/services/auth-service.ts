import api from './api';
import { useAuthStore } from '../store/auth-store';
import { userService } from './user-service';
import {
  RegisterRequest,
  LoginRequest,
  AuthResult,
  LoginResponse,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
} from '../types/auth';
import { UserProfile } from '../types/user';

const API_BASE_URL = 'http://localhost:8080/api';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post(`${API_BASE_URL}/Auth/login`, data);
    const result = response.data as LoginResponse;

    if (result.success && result.accessToken && result.refreshToken) {
      useAuthStore.getState().login({} as UserProfile, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      try {
        const userProfile = await userService.getProfile();
        useAuthStore.getState().setUser(userProfile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    }

    return result;
  },

  async register(data: RegisterRequest): Promise<AuthResult> {
    const response = await api.post(`${API_BASE_URL}/Auth/register`, data);
    return response.data as AuthResult;
  },

  async verifyEmail(
    email: string,
    verificationCode: string
  ): Promise<AuthResult> {
    const verifyData: VerifyEmailRequest = {
      email,
      verificationCode,
    };
    const response = await api.post(
      `${API_BASE_URL}/Auth/verify-email`,
      verifyData
    );
    return response.data as AuthResult;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const data: ForgotPasswordRequest = { email };
    const response = await api.post(
      `${API_BASE_URL}/Auth/forgot-password`,
      data
    );
    return response.data as ForgotPasswordResponse;
  },

  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    const response = await api.post(
      `${API_BASE_URL}/Auth/reset-password`,
      data
    );
    return response.data as ForgotPasswordResponse;
  },
};
