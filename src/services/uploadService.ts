/**
 * File Upload Service (Legacy Bridge)
 * 
 * IMPORTANT: This file provides backward compatibility with the file upload implementation.
 * New code should use the consolidated implementation from files/uploadService.ts.
 * 
 * This bridge ensures existing code continues to function while we transition to the improved structure.
 */

// Import the consolidated upload service
import { uploadService as consolidatedUploadService } from './files/uploadService';

// Log deprecation warning in development
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'DEPRECATION NOTICE: Using services/uploadService.ts is deprecated. ' +
    'Please use services/files/uploadService.ts for all new code.'
  );
}

/**
 * Upload service providing methods for file uploads
 * @deprecated Use uploadService from files/uploadService.ts instead
 */
export const uploadService = {
  /**
   * Upload a user avatar image
   * 
   * @param file File to upload
   * @returns Promise resolving to the avatar URL
   */
  uploadAvatar(file: File): Promise<string> {
    return consolidatedUploadService.uploadAvatar(file);
  },

  /**
   * Upload a verification document
   * 
   * @param file File to upload
   * @param documentType Type of verification document
   * @returns Promise resolving to the document ID
   */
  uploadVerificationDocument(file: File, documentType: string): Promise<string> {
    return consolidatedUploadService.uploadVerificationDocument(file, documentType);
  }
};

export default uploadService;
