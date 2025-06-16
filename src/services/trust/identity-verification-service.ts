/**
 * Enhanced Identity Verification Service
 * 
 * Comprehensive identity verification with OCR processing, biometric verification,
 * address validation, and professional credential verification for marketplace trust.
 */

import errorService from '@/services/error-service';
import { ApiResponse } from '@/types';
import { apiClient } from '../api/api-client';

export type VerificationStatus = 
  | 'pending'
  | 'processing'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'requires_action';

export type DocumentType = 
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'utility_bill'
  | 'bank_statement'
  | 'professional_license'
  | 'educational_certificate'
  | 'employment_verification';

export type BiometricType = 
  | 'facial_recognition'
  | 'liveness_detection'
  | 'voice_recognition'
  | 'fingerprint';

export interface DocumentData {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  status: VerificationStatus;
  
  // OCR Results
  ocrData?: {
    extractedText: string;
    confidence: number;
    fields: Record<string, {
      value: string;
      confidence: number;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    documentQuality: {
      sharpness: number;
      brightness: number;
      contrast: number;
      resolution: number;
    };
  };
  
  // Validation Results
  validation?: {
    isValid: boolean;
    checks: {
      formatValid: boolean;
      dataConsistent: boolean;
      notExpired: boolean;
      notTampered: boolean;
      matchesUserData: boolean;
    };
    riskScore: number;
    flags: string[];
  };
  
  rejectionReason?: string;
  expiryDate?: Date;
  issueDate?: Date;
  issuingAuthority?: string;
}

export interface BiometricData {
  id: string;
  type: BiometricType;
  status: VerificationStatus;
  capturedAt: Date;
  
  // Facial Recognition Data
  faceData?: {
    faceId: string;
    confidence: number;
    landmarks: Array<{
      type: string;
      x: number;
      y: number;
    }>;
    quality: {
      sharpness: number;
      lighting: number;
      angle: number;
      occlusion: number;
    };
  };
  
  // Liveness Detection Data
  livenessData?: {
    isLive: boolean;
    confidence: number;
    challenges: Array<{
      type: 'blink' | 'smile' | 'turn_head' | 'nod';
      completed: boolean;
      confidence: number;
    }>;
  };
  
  // Comparison Results
  comparison?: {
    matchScore: number;
    isMatch: boolean;
    confidence: number;
    documentFaceId?: string;
  };
}

export interface AddressVerification {
  id: string;
  status: VerificationStatus;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  // Verification Methods
  verificationMethods: Array<{
    type: 'utility_bill' | 'bank_statement' | 'government_mail' | 'credit_report';
    documentId: string;
    verified: boolean;
    confidence: number;
  }>;
  
  // Address Validation
  validation: {
    addressExists: boolean;
    deliverable: boolean;
    residential: boolean;
    riskScore: number;
    flags: string[];
  };
  
  verifiedAt?: Date;
}

export interface ProfessionalCredential {
  id: string;
  type: 'license' | 'certification' | 'degree' | 'employment';
  title: string;
  issuingOrganization: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialNumber: string;
  status: VerificationStatus;
  
  // Verification Results
  verification: {
    isValid: boolean;
    isActive: boolean;
    matchesUserData: boolean;
    verifiedWithIssuer: boolean;
    confidence: number;
  };
  
  documentId?: string;
  verifiedAt?: Date;
}

export interface BackgroundCheck {
  id: string;
  status: VerificationStatus;
  requestedAt: Date;
  completedAt?: Date;
  
  // Check Types
  checks: {
    criminalHistory: {
      status: VerificationStatus;
      results?: {
        hasRecords: boolean;
        records: Array<{
          type: string;
          date: Date;
          jurisdiction: string;
          disposition: string;
        }>;
      };
    };
    
    creditCheck: {
      status: VerificationStatus;
      results?: {
        score: number;
        riskLevel: 'low' | 'medium' | 'high';
        flags: string[];
      };
    };
    
    employmentHistory: {
      status: VerificationStatus;
      results?: Array<{
        employer: string;
        position: string;
        startDate: Date;
        endDate?: Date;
        verified: boolean;
      }>;
    };
    
    educationHistory: {
      status: VerificationStatus;
      results?: Array<{
        institution: string;
        degree: string;
        graduationDate: Date;
        verified: boolean;
      }>;
    };
  };
  
  overallRiskScore: number;
  recommendations: string[];
}

export interface IdentityVerificationProfile {
  id: string;
  userId: string;
  status: VerificationStatus;
  overallTrustScore: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Personal Information
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    nationality: string;
    placeOfBirth?: string;
  };
  
  // Verification Components
  documents: DocumentData[];
  biometrics: BiometricData[];
  addressVerification?: AddressVerification;
  professionalCredentials: ProfessionalCredential[];
  backgroundCheck?: BackgroundCheck;
  
  // Verification Timeline
  timeline: Array<{
    timestamp: Date;
    event: string;
    status: VerificationStatus;
    details?: string;
    performedBy: 'system' | 'manual_reviewer' | 'user';
  }>;
  
  // Review Information
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  nextReviewDate?: Date;
}

/**
 * Upload and process identity document with OCR
 */
export async function uploadIdentityDocument(
  file: File,
  documentType: DocumentType,
  metadata?: Record<string, any>
): Promise<ApiResponse<DocumentData>> {
  try {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return await apiClient.post('/identity/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to upload identity document');
    throw error;
  }
}

/**
 * Process document with OCR and validation
 */
export async function processDocumentOCR(
  documentId: string,
  options?: {
    extractFields?: string[];
    validateFormat?: boolean;
    checkTampering?: boolean;
  }
): Promise<ApiResponse<DocumentData>> {
  try {
    return await apiClient.post(`/identity/documents/${documentId}/process`, options);
  } catch (error) {
    errorService.handleError(error, 'Failed to process document OCR');
    throw error;
  }
}

/**
 * Capture and process biometric data
 */
export async function captureBiometric(
  type: BiometricType,
  data: Blob | string,
  options?: {
    requireLiveness?: boolean;
    compareToDocument?: string;
    challenges?: string[];
  }
): Promise<ApiResponse<BiometricData>> {
  try {
    const formData = new FormData();
    formData.append('biometric', data);
    formData.append('type', type);
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    return await apiClient.post('/identity/biometrics/capture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to capture biometric data');
    throw error;
  }
}

/**
 * Verify address using uploaded documents
 */
export async function verifyAddress(
  address: AddressVerification['address'],
  documentIds: string[]
): Promise<ApiResponse<AddressVerification>> {
  try {
    return await apiClient.post('/identity/address/verify', {
      address,
      documentIds
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to verify address');
    throw error;
  }
}

/**
 * Verify professional credentials
 */
export async function verifyProfessionalCredential(
  credential: Omit<ProfessionalCredential, 'id' | 'status' | 'verification' | 'verifiedAt'>,
  documentId?: string
): Promise<ApiResponse<ProfessionalCredential>> {
  try {
    return await apiClient.post('/identity/credentials/verify', {
      ...credential,
      documentId
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to verify professional credential');
    throw error;
  }
}

/**
 * Request background check
 */
export async function requestBackgroundCheck(
  checkTypes: Array<'criminal' | 'credit' | 'employment' | 'education'>,
  consent: {
    agreedToTerms: boolean;
    signature: string;
    timestamp: Date;
  }
): Promise<ApiResponse<BackgroundCheck>> {
  try {
    return await apiClient.post('/identity/background-check/request', {
      checkTypes,
      consent
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to request background check');
    throw error;
  }
}

/**
 * Get identity verification profile
 */
export async function getIdentityProfile(userId?: string): Promise<ApiResponse<IdentityVerificationProfile>> {
  try {
    const endpoint = userId ? `/identity/profile/${userId}` : '/identity/profile';
    return await apiClient.get(endpoint);
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch identity profile');
    throw error;
  }
}

/**
 * Submit identity verification for review
 */
export async function submitForReview(
  profileId: string,
  submissionNotes?: string
): Promise<ApiResponse<IdentityVerificationProfile>> {
  try {
    return await apiClient.post(`/identity/profile/${profileId}/submit`, {
      submissionNotes
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to submit for review');
    throw error;
  }
}

/**
 * Get verification status and progress
 */
export async function getVerificationStatus(
  profileId: string
): Promise<ApiResponse<{
  status: VerificationStatus;
  progress: number;
  completedSteps: string[];
  pendingSteps: string[];
  estimatedCompletionTime: string;
}>> {
  try {
    return await apiClient.get(`/identity/profile/${profileId}/status`);
  } catch (error) {
    errorService.handleError(error, 'Failed to get verification status');
    throw error;
  }
}

// Export service object
export const identityVerificationService = {
  uploadIdentityDocument,
  processDocumentOCR,
  captureBiometric,
  verifyAddress,
  verifyProfessionalCredential,
  requestBackgroundCheck,
  getIdentityProfile,
  submitForReview,
  getVerificationStatus
};

export default identityVerificationService;
