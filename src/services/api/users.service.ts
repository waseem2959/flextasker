/**
 * Enhanced User API Service
 * 
 * This service handles all API requests related to users and authentication,
 * including login, registration, profile management, and account settings.
 * It uses the centralized API client for making HTTP requests with improved
 * TypeScript patterns, error handling, and proper type checking.
 */

import { apiClient } from './base-client';
import tokenManager from './token-manager';
import { User } from '@/types';
import {
  ApiResponse,
  PaginatedApiResponse,
  LoginCredentials,
  RegisterData,
  UpdateProfileRequest,
  AuthTokenResponse,
  UserSearchParams
} from '@/types/api';

// Note: Most of the user-related types have been moved to the centralized @/types/api module.
// We're now importing LoginCredentials, RegisterData, UpdateProfileRequest, and AuthTokenResponse from there.

/**
 * Change password request interface 
 * This remains local as it's only used within this service
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Note: UserSearchParams has been moved to the centralized @/types/api module

/**
 * Enhanced User API Service Class
 * Provides methods for interacting with user-related endpoints and authentication
 * with improved TypeScript patterns and error handling
 */
class UserService {
  private readonly baseUrl = '/api/v1/users';
  private readonly authUrl = '/api/v1/auth';

  /**
   * Login a user with email and password
   * 
   * @param credentials - The login credentials
   * @returns Promise with authentication tokens and user data
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthTokenResponse>> {
    const response = await apiClient.post(`${this.authUrl}/login`, credentials);
    
    // Store the token for future requests
    if (response.data.success && response.data.data?.accessToken) {
      tokenManager.setToken(response.data.data.accessToken);
    }
    
    return response.data;
  }

  /**
   * Register a new user account
   * 
   * @param userData - The user registration data
   * @returns Promise with the created user and authentication tokens
   */
  async register(userData: RegisterData): Promise<ApiResponse<AuthTokenResponse>> {
    const response = await apiClient.post(`${this.authUrl}/register`, userData);
    
    // Store the token for future requests
    if (response.data.success && response.data.data?.accessToken) {
      tokenManager.setToken(response.data.data.accessToken);
    }
    
    return response.data;
  }

  /**
   * Logout the current user
   * 
   * @returns Promise with success message
   */
  async logout(): Promise<ApiResponse<null>> {
    // Try to revoke the token on the server
    try {
      await apiClient.post(`${this.authUrl}/logout`);
    } catch (error) {
      console.warn('Error during logout:', error);
    }
    
    // Always remove the token locally
    tokenManager.removeToken();
    
    return {
      success: true,
      message: 'Logged out successfully',
      data: null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get the current authenticated user's profile
   * 
   * @returns Promise with the user profile data
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await apiClient.get(`${this.authUrl}/me`);
    return response.data;
  }

  /**
   * Get a specific user's profile by ID
   * 
   * @param id - The user ID
   * @returns Promise with the user profile data
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Search for users with enhanced filtering and pagination
   * 
   * @param params - Search parameters for filtering users
   * @returns Promise with paginated user data
   */
  async searchUsers(params?: UserSearchParams): Promise<PaginatedApiResponse<User>> {
    const response = await apiClient.get(`${this.baseUrl}/search`, { params });
    return response.data;
  }

  /**
   * Get ratings and reviews for a user with enhanced typing
   * 
   * @param userId - The user ID to get reviews for
   * @param params - Optional pagination and sorting parameters
   * @returns Promise with paginated reviews data
   */
  async getUserReviews(userId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedApiResponse<{
    id: string;
    rating: number;
    title: string;
    comment: string;
    createdAt: Date;
    author: User;
  }>> {
    const response = await apiClient.get(`${this.baseUrl}/${userId}/reviews`, { params });
    return response.data;
  }

  /**
   * Update the current user's profile
   * 
   * @param profileData - The profile data to update
   * @returns Promise with the updated user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<User>> {
    // Handle file uploads with FormData
    if (profileData.avatar) {
      const formData = new FormData();
      
      // Add all other fields
      Object.entries(profileData).forEach(([key, value]) => {
        if (key !== 'avatar' && value !== undefined) {
          formData.append(key, value as string);
        }
      });
      
      // Add the avatar file
      if (profileData.avatar) {
        formData.append('avatar', profileData.avatar);
      }
      
      const response = await apiClient.put(`${this.baseUrl}/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    }
    
    // Regular JSON request for non-file updates
    const response = await apiClient.put(`${this.baseUrl}/profile`, profileData);
    return response.data;
  }

  /**
   * Change the current user's password
   * 
   * @param passwordData - The password change data
   * @returns Promise with success message
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.put(`${this.baseUrl}/password`, passwordData);
    return response.data;
  }

  /**
   * Request a password reset for a user
   * 
   * @param email - The user's email address
   * @returns Promise with success message
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post(`${this.authUrl}/forgot-password`, { email });
    return response.data;
  }

  /**
   * Reset a user's password with a reset token
   * 
   * @param token - The password reset token
   * @param newPassword - The new password
   * @returns Promise with success message
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post(`${this.authUrl}/reset-password`, {
      token,
      newPassword
    });
    return response.data;
  }
}

// Export a singleton instance
export const userService = new UserService();
