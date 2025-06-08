/**
 * Role Switching Service
 * 
 * Handles role switching functionality allowing users to toggle between
 * User and Tasker roles within their account while maintaining data integrity.
 */

import { ApiResponse } from '@/types';
import { RoleAvailabilityCheck, RoleSwitchRequest, RoleSwitchResponse } from '../../../shared/types/common/user-types';
import { UserRole } from '../../../shared/types/enums';
import { apiClient } from '../api/api-client';
import { errorService } from '../error/error-service';

/**
 * Switch user's active role
 */
export async function switchUserRole(targetRole: UserRole): Promise<ApiResponse<RoleSwitchResponse>> {
  try {
    const request: RoleSwitchRequest = {
      targetRole,
      reason: 'User initiated role switch'
    };

    const response = await apiClient.post<RoleSwitchResponse>('/auth/switch-role', request);
    
    if (response.success && response.data) {
      // Update local storage with new role information
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser && response.data) {
        currentUser.activeRole = response.data.newRole;
        currentUser.availableRoles = response.data.availableRoles;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    }

    return response;
  } catch (error) {
    errorService.handleError(error, 'Failed to switch user role');
    throw error;
  }
}

/**
 * Check if a role is available for the current user
 */
export async function checkRoleAvailability(role: UserRole): Promise<ApiResponse<RoleAvailabilityCheck>> {
  try {
    return await apiClient.get<RoleAvailabilityCheck>(`/auth/role-availability/${role}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to check role availability');
    throw error;
  }
}

/**
 * Get all available roles for the current user
 */
export async function getAvailableRoles(): Promise<ApiResponse<UserRole[]>> {
  try {
    return await apiClient.get<UserRole[]>('/auth/available-roles');
  } catch (error) {
    errorService.handleError(error, 'Failed to get available roles');
    throw error;
  }
}

/**
 * Enable a role for the current user (if requirements are met)
 */
export async function enableRole(role: UserRole): Promise<ApiResponse<RoleSwitchResponse>> {
  try {
    return await apiClient.post<RoleSwitchResponse>('/auth/enable-role', { role });
  } catch (error) {
    errorService.handleError(error, 'Failed to enable role');
    throw error;
  }
}

/**
 * Get role requirements for a specific role
 */
export async function getRoleRequirements(role: UserRole): Promise<ApiResponse<{
  requirements: {
    profileCompletion: boolean;
    verification: boolean;
    minimumRating?: number;
    minimumTasks?: number;
  };
  currentStatus: {
    profileCompleted: boolean;
    isVerified: boolean;
    currentRating?: number;
    completedTasks?: number;
  };
  missingRequirements: string[];
}>> {
  try {
    return await apiClient.get(`/auth/role-requirements/${role}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to get role requirements');
    throw error;
  }
}

/**
 * Update role preferences
 */
export async function updateRolePreferences(preferences: {
  [key in UserRole]?: {
    isEnabled: boolean;
    notifications?: boolean;
  };
}): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.put('/auth/role-preferences', { preferences });
  } catch (error) {
    errorService.handleError(error, 'Failed to update role preferences');
    throw error;
  }
}

/**
 * Get user's role history
 */
export async function getRoleHistory(): Promise<ApiResponse<{
  switches: {
    fromRole: UserRole;
    toRole: UserRole;
    timestamp: string;
    reason?: string;
  }[];
  totalSwitches: number;
  lastSwitch?: string;
}>> {
  try {
    return await apiClient.get('/auth/role-history');
  } catch (error) {
    errorService.handleError(error, 'Failed to get role history');
    throw error;
  }
}

// Export service object
export const roleSwitchingService = {
  switchUserRole,
  checkRoleAvailability,
  getAvailableRoles,
  enableRole,
  getRoleRequirements,
  updateRolePreferences,
  getRoleHistory
};

export default roleSwitchingService;
