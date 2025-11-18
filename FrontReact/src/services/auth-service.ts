import axios from 'axios';
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

const API_BASE_URL = 'http://localhost:8080/api';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResult> {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
    return response.data as AuthResult;
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
    return response.data as LoginResponse;
  },

  async verifyEmail(
    email: string,
    verificationCode: string
  ): Promise<AuthResult> {
    const verifyData: VerifyEmailRequest = {
      email,
      verificationCode,
    };
    const response = await axios.post(
      `${API_BASE_URL}/auth/verify-email`,
      verifyData
    );
    return response.data as AuthResult;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const data: ForgotPasswordRequest = { email };
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, data);
    return response.data as ForgotPasswordResponse;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, data);
    return response.data as ForgotPasswordResponse;
  },
};
