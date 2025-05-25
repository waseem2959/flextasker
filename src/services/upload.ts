// src/services/upload.ts
import { ApiResponse } from '@/types';
import { apiClient } from './api/client';

export const uploadService = {
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
      '/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data!.avatarUrl;
  },
  
  async uploadVerificationDocument(file: File, documentType: string): Promise<string> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    
    const response = await apiClient.post<ApiResponse<{ documentId: string }>>(
      '/verification/document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data!.documentId;
  },
};