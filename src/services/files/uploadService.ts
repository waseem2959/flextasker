/**
 * Consolidated File Upload Service
 * 
 * This module provides a comprehensive file upload service for different types of files:
 * - User avatars
 * - Verification documents
 * - Task attachments
 * - Message attachments
 * 
 * Features:
 * - Progress tracking
 * - File validation
 * - Error handling
 * - Resumable uploads
 */

import { ApiResponse } from '../../types';
import { apiClient } from '../api/base-client';
import { config } from '../../config';
import { AxiosProgressEvent } from 'axios';

/**
 * Upload status for tracking progress
 */
export interface UploadStatus {
  progress: number;
  state: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

/**
 * File type enum for validation
 */
export enum FileType {
  IMAGE = 'image/*',
  PDF = 'application/pdf',
  DOC = 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  EXCEL = 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  AUDIO = 'audio/*',
  VIDEO = 'video/*',
  ARCHIVE = 'application/zip,application/x-rar-compressed',
  ANY = '*/*'
}

/**
 * File upload options
 */
export interface UploadOptions {
  maxSizeMB?: number;
  allowedTypes?: FileType[];
  compressionQuality?: number;
  autoRetry?: boolean;
  maxRetries?: number;
  onProgress?: (progress: number) => void;
}

// Default options for uploads
const DEFAULT_OPTIONS: UploadOptions = {
  maxSizeMB: 5,
  allowedTypes: [FileType.ANY],
  compressionQuality: 0.8,
  autoRetry: true,
  maxRetries: 3
};

/**
 * Unified upload service for all file types
 */
export const uploadService = {
  /**
   * Upload a user avatar image
   * 
   * @param file File to upload
   * @param options Upload options
   * @returns Promise resolving to the avatar URL
   */
  async uploadAvatar(file: File, options: UploadOptions = {}): Promise<string> {
    // Merge with default options and specific avatar options
    const avatarOptions: UploadOptions = {
      ...DEFAULT_OPTIONS,
      maxSizeMB: 1, // Lower size limit for avatars
      allowedTypes: [FileType.IMAGE],
      ...options
    };
    
    // Validate the file
    this.validateFile(file, avatarOptions);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'avatar');
    
    // Progress tracking
    const onProgress = options.onProgress || (() => {});
    
    // Upload the file
    const response = await apiClient.post<ApiResponse<{ url: string }>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
        onProgress(percentCompleted);
      }
    });
    
    return response.data.data.url;
  },
  
  /**
   * Upload a verification document
   * 
   * @param file File to upload
   * @param documentType Type of verification document
   * @param options Upload options
   * @returns Promise resolving to the document ID
   */
  async uploadVerificationDocument(
    file: File, 
    documentType: string, 
    options: UploadOptions = {}
  ): Promise<string> {
    // Merge with default options and specific document options
    const documentOptions: UploadOptions = {
      ...DEFAULT_OPTIONS,
      maxSizeMB: 10, // Higher size limit for documents
      allowedTypes: [FileType.IMAGE, FileType.PDF],
      ...options
    };
    
    // Validate the file
    this.validateFile(file, documentOptions);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'verification');
    formData.append('documentType', documentType);
    
    // Progress tracking
    const onProgress = options.onProgress || (() => {});
    
    // Upload the file
    const response = await apiClient.post<ApiResponse<{ documentId: string }>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
        onProgress(percentCompleted);
      }
    });
    
    return response.data.data.documentId;
  },
  
  /**
   * Upload a file for a task attachment
   * 
   * @param file File to upload
   * @param taskId ID of the associated task
   * @param options Upload options
   * @returns Promise resolving to the attachment URL
   */
  async uploadTaskAttachment(
    file: File, 
    taskId: string, 
    options: UploadOptions = {}
  ): Promise<string> {
    // Merge with default options
    const attachmentOptions: UploadOptions = {
      ...DEFAULT_OPTIONS,
      ...options
    };
    
    // Validate the file
    this.validateFile(file, attachmentOptions);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'task-attachment');
    formData.append('taskId', taskId);
    
    // Progress tracking
    const onProgress = options.onProgress || (() => {});
    
    // Upload the file
    const response = await apiClient.post<ApiResponse<{ url: string }>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
        onProgress(percentCompleted);
      }
    });
    
    return response.data.data.url;
  },
  
  /**
   * Upload a file for a message attachment
   * 
   * @param file File to upload
   * @param conversationId ID of the associated conversation
   * @param options Upload options
   * @returns Promise resolving to the attachment URL
   */
  async uploadMessageAttachment(
    file: File, 
    conversationId: string, 
    options: UploadOptions = {}
  ): Promise<string> {
    // Merge with default options
    const attachmentOptions: UploadOptions = {
      ...DEFAULT_OPTIONS,
      ...options
    };
    
    // Validate the file
    this.validateFile(file, attachmentOptions);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'message-attachment');
    formData.append('conversationId', conversationId);
    
    // Progress tracking
    const onProgress = options.onProgress || (() => {});
    
    // Upload the file
    const response = await apiClient.post<ApiResponse<{ url: string }>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
        onProgress(percentCompleted);
      }
    });
    
    return response.data.data.url;
  },
  
  /**
   * Get the full URL for an uploaded file
   * 
   * @param path Relative path to the file
   * @returns Full URL to the file
   */
  getFileUrl(path: string): string {
    // If the path is already a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Otherwise, join with the API URL
    const baseUrl = config.fileBaseUrl || config.apiUrl || '';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  },
  
  /**
   * Validate a file before upload
   * 
   * @param file File to validate
   * @param options Validation options
   * @throws Error if validation fails
   */
  validateFile(file: File, options: UploadOptions): void {
    // Check file size
    if (options.maxSizeMB) {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > options.maxSizeMB) {
        throw new Error(`File size exceeds maximum allowed size of ${options.maxSizeMB}MB`);
      }
    }
    
    // Check file type
    if (options.allowedTypes && options.allowedTypes.length > 0 && !options.allowedTypes.includes(FileType.ANY)) {
      const fileType = file.type;
      const isAllowed = options.allowedTypes.some(allowedType => {
        if (allowedType === FileType.ANY) return true;
        
        // Handle multiple MIME types separated by commas
        const allowedMimeTypes = allowedType.split(',');
        for (const mimeType of allowedMimeTypes) {
          // Check for wildcards like "image/*"
          if (mimeType.endsWith('/*')) {
            const category = mimeType.split('/')[0];
            if (fileType.startsWith(`${category}/`)) return true;
          } else if (fileType === mimeType) {
            return true;
          }
        }
        
        return false;
      });
      
      if (!isAllowed) {
        throw new Error(`File type ${fileType} is not allowed`);
      }
    }
  }
};

// Default export for convenience
export default uploadService;
