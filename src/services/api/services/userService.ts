/**
 * User Service
 * 
 * This module provides API methods for user management and authentication:
 * - Login and registration
 * - Password management
 * - Profile management
 * - User search and retrieval
 */

import { apiClient } from '../client';
import { User } from '@/types';
import {
  ApiResponse,
  PaginatedApiResponse,
  LoginCredentials,
  RegisterData,
  UpdateProfileRequest,
  AuthTokenResponse
} from '@/types/api';

/**
 * Change password request interface
 */
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * User search parameters
 */
export interface UserSearchParams {
  query?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Login a user with email and password
 * 
 * @param credentials - The login credentials
 * @returns Promise with authentication tokens and user data
 */
export function login(credentials: LoginCredentials): Promise<ApiResponse<AuthTokenResponse>> {
  return apiClient.post('/auth/login', credentials);
}

/**
 * Register a new user
 * 
 * @param userData - The registration data
 * @returns Promise with authentication tokens and user data
 */
export function register(userData: RegisterData): Promise<ApiResponse<AuthTokenResponse>> {
  return apiClient.post('/auth/register', userData);
}

/**
 * Request a password reset
 * 
 * @param email - The user's email
 * @returns Promise indicating success or failure
 */
export function requestPasswordReset(email: string): Promise<ApiResponse<void>> {
  return apiClient.post('/auth/password-reset-request', { email });
}

/**
 * Reset a password with a token
 * 
 * @param token - The reset token
 * @param newPassword - The new password
 * @returns Promise indicating success or failure
 */
export function resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
  return apiClient.post('/auth/password-reset', {
    token,
    newPassword
  });
}

/**
 * Refresh the authentication token
 * 
 * @param refreshToken - The refresh token
 * @returns Promise with new authentication tokens
 */
export function refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokenResponse>> {
  return apiClient.post('/auth/refresh-token', { refreshToken });
}

/**
 * Logout the user
 * 
 * @returns Promise indicating success or failure
 */
export function logout(): Promise<ApiResponse<void>> {
  return apiClient.post('/auth/logout');
}

/**
 * Get the current user's profile
 * 
 * @returns Promise with the user data
 */
export function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiClient.get('/users/me');
}

/**
 * Update the current user's profile
 * 
 * @param profileData - The profile data to update
 * @returns Promise with the updated user data
 */
export function updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<User>> {
  return apiClient.put('/users/me', profileData);
}

/**
 * Change the current user's password
 * 
 * @param passwordData - The password change data
 * @returns Promise indicating success or failure
 */
export function changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<void>> {
  return apiClient.put('/users/me/password', passwordData);
}

/**
 * Get a user by ID
 * 
 * @param id - The user ID
 * @returns Promise with the user data
 */
export function getUserById(id: string): Promise<ApiResponse<User>> {
  return apiClient.get(`/users/${id}`);
}

/**
 * Search for users
 * 
 * @param params - Search parameters
 * @returns Promise with users and pagination info
 */
export function searchUsers(params?: UserSearchParams): Promise<PaginatedApiResponse<User>> {
  return apiClient.get('/users', params) as Promise<PaginatedApiResponse<User>>;
}

/**
 * Delete the current user's account
 * 
 * @returns Promise indicating success or failure
 */
export function deleteAccount(): Promise<ApiResponse<void>> {
  return apiClient.delete('/users/me');
}

// Export all functions as a service object for convenience
export const userService = {
  login,
  register,
  requestPasswordReset,
  resetPassword,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  getUserById,
  searchUsers,
  deleteAccount
};

// Default export for convenience
export default userService;
