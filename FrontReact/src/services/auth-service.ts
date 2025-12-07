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
  RefreshTokenResponse,
} from '../types/auth';
import { UserProfile } from '../types/user';

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL + '/api';

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

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await api.post(`${API_BASE_URL}/Auth/refresh`, {
      refreshToken,
    });
    return response.data as RefreshTokenResponse;
  },

  async resendVerificationCode(email: string): Promise<AuthResult> {
    const data = { email };
    const response = await api.post(
      `${API_BASE_URL}/Auth/resend-verification-code`,
      data
    );
    return response.data as AuthResult;
  },
};
