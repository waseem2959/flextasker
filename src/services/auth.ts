/**
 * Authentication Service with TypeScript Improvements
 * 
 * This file provides a consolidated service for authentication-related operations
 * with improved TypeScript typing and error handling.
 */

import { ApiResponse, LoginCredentials, User } from '@/types';
import { apiClient } from './api/base-client';
import tokenManager from './api/token-manager';

// Define the AuthResult interface for authentication responses
interface AuthResult {
  token: string;
  user: User;
}

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