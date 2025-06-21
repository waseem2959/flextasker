/**
 * Simplified File Upload Service
 *
 * Basic file upload functionality without complex features
 */

import { ApiResponse } from '../../types';
import { apiClient } from '../api/api-client';

/**
 * File type enum for validation
 */
export enum FileType {
  IMAGE = 'image/*',
  PDF = 'application/pdf',
  DOC = 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ANY = '*/*'
}

/**
 * Simplified upload options
 */
export interface UploadOptions {
  maxSizeMB?: number;
  allowedTypes?: FileType[];
}

// Default options for uploads
const DEFAULT_OPTIONS: UploadOptions = {
  maxSizeMB: 5,
  allowedTypes: [FileType.ANY]
};

/**
 * Validate a file before upload (simplified)
 */
export function validateFile(file: File, options: UploadOptions = DEFAULT_OPTIONS): void {
  const { maxSizeMB = 5, allowedTypes = [FileType.ANY] } = options;

  // Check file size
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > maxSizeMB) {
    throw new Error(`File size exceeds the maximum allowed size (${maxSizeMB}MB)`);
  }

  // Check file type if not allowing any type
  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(FileType.ANY)) {
    const isValidType = allowedTypes.some(allowedType => {
      if (allowedType === FileType.ANY) return true;

      const allowedMimeTypes = allowedType.split(',');
      return allowedMimeTypes.some(mimeType => {
        if (mimeType.endsWith('/*')) {
          const generalType = mimeType.split('/')[0];
          return file.type.startsWith(`${generalType}/`);
        }
        return file.type === mimeType;
      });
    });

    if (!isValidType) {
      throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }
}

/**
 * Upload a file (simplified)
 */
export async function uploadFile(file: File, type: string, options: UploadOptions = {}): Promise<string> {
  // Merge with default options
  const uploadOptions: UploadOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  // Validate the file
  validateFile(file, uploadOptions);

  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  // Upload the file
  const response = await apiClient.post<ApiResponse<{ url: string }>>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return (response.data as any)?.url ?? '';
}

/**
 * Upload a user avatar image
 */
export async function uploadAvatar(file: File, options: UploadOptions = {}): Promise<string> {
  const avatarOptions: UploadOptions = {
    maxSizeMB: 1,
    allowedTypes: [FileType.IMAGE],
    ...options
  };

  return uploadFile(file, 'avatar', avatarOptions);
}

/**
 * Upload a task attachment
 */
export async function uploadTaskAttachment(file: File, taskId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'task-attachment');
  formData.append('taskId', taskId);

  const response = await apiClient.post<ApiResponse<{ url: string }>>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return (response.data as any)?.url ?? '';
}

/**
 * Get the full URL for an uploaded file
 */
export function getFileUrl(path: string): string {
  if (!path) return '';

  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // Get the base API URL from environment variables
  const baseUrl = (typeof process !== 'undefined' && process.env?.VITE_API_URL) ?? 'http://localhost:5000/api';
  const fileBaseUrl = (typeof process !== 'undefined' && process.env?.VITE_FILE_BASE_URL) ?? `${baseUrl}/files`;

  return `${fileBaseUrl}/${cleanPath}`;
}

// Export service object for compatibility
export const uploadService = {
  uploadFile,
  uploadAvatar,
  uploadTaskAttachment,
  getFileUrl,
  validateFile
};

// Default export for convenience
export default uploadService;


