import axios from 'axios';
import {
  RegisterRequest,
  LoginRequest,
  AuthResult,
  LoginResponse,
  VerifyEmailRequest,
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
};
