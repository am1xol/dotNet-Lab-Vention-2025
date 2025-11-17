import axios from 'axios';
import { RegisterRequest, LoginRequest, AuthResult, LoginResponse } from '../types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResult> {
    const response = await axios.post<AuthResult>(`${API_BASE_URL}/auth/register`, data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, data);
    return response.data;
  },

  async verifyEmail(email: string, verificationCode: string): Promise<AuthResult> {
    const response = await axios.post<AuthResult>(`${API_BASE_URL}/auth/verify-email`, {
      email,
      verificationCode
    });
    return response.data;
  },
};