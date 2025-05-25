// src/services/auth.ts
import { ApiResponse, AuthResult, LoginCredentials, User } from '@/types';
import { apiClient, tokenManager } from './api/client';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'USER' | 'TASKER';
  }): Promise<AuthResult> {
    const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/register', data);
    
    if (response.data.data) {
      tokenManager.setToken(response.data.data.token);
    }
    
    return response.data.data!;
  },

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', credentials);
    
    if (response.data.data) {
      tokenManager.setToken(response.data.data.token);
    }
    
    return response.data.data!;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      tokenManager.removeToken();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data!.user;
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },
};