/**
 * User Service Index
 * 
 * This file centralizes exports for user-related services.
 */

import userService, {
    formatTrustScore,
    formatUserName,
    generateAvatarUrl,
    getInitials,
    getTrustLevel,
    getUserDisplayName,
    sanitizeInput
} from './user-service';

// Named exports
export {
    formatTrustScore, formatUserName, generateAvatarUrl, getInitials, getTrustLevel, getUserDisplayName, sanitizeInput
};

// Default export
export default userService;