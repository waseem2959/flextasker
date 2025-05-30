/**
 * File Services Index
 * 
 * This file exports all file-related services in a structured way.
 * It provides a centralized entry point for accessing file upload and management functionality.
 */

// Import from uploadService
import uploadService, { UploadStatus, FileType, UploadOptions } from './uploadService';

// Re-export everything that's available
// Service export
export { uploadService };

// Type exports - using 'export type' for proper isolation
export type { UploadStatus, FileType, UploadOptions };

// Default export for convenience
export default { uploadService };
