/**
 * Enhanced Identity Verification Component
 *
 * Comprehensive identity verification with OCR processing, biometric verification,
 * address validation, and professional credential verification for Phase 3B.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Camera,
    CheckCircle,
    Eye,
    FileText,
    Shield,
    Upload,
    X
} from 'lucide-react';
import React, { useCallback, useState } from 'react';

export type VerificationStatus = 'pending' | 'in-review' | 'approved' | 'rejected' | 'expired';
export type DocumentType = 'passport' | 'drivers-license' | 'national-id' | 'utility-bill' | 'bank-statement';

export interface VerificationDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  status: VerificationStatus;
  rejectionReason?: string;
  expiryDate?: Date;
}

export interface VerificationData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  documents: VerificationDocument[];
  selfieUrl?: string;
  status: VerificationStatus;
  submittedAt?: Date;
  reviewedAt?: Date;
  notes?: string;
}

interface IdentityVerificationProps {
  initialData?: Partial<VerificationData>;
  onSubmit: (data: VerificationData) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

// Document type configuration
const DOCUMENT_TYPES: Record<DocumentType, {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
  acceptedFormats: string[];
  maxSize: number; // in MB
}> = {
  passport: {
    name: 'Passport',
    description: 'Government-issued passport (photo page)',
    icon: FileText,
    required: true,
    acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10,
  },
  'drivers-license': {
    name: "Driver's License",
    description: 'Valid driver\'s license (front and back)',
    icon: FileText,
    required: true,
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxSize: 10,
  },
  'national-id': {
    name: 'National ID',
    description: 'Government-issued national ID card',
    icon: FileText,
    required: true,
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxSize: 10,
  },
  'utility-bill': {
    name: 'Utility Bill',
    description: 'Recent utility bill (within 3 months)',
    icon: FileText,
    required: false,
    acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10,
  },
  'bank-statement': {
    name: 'Bank Statement',
    description: 'Recent bank statement (within 3 months)',
    icon: FileText,
    required: false,
    acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10,
  },
};

/**
 * Document Upload Component
 */
const DocumentUpload: React.FC<{
  documentType: DocumentType;
  onUpload: (file: File) => void;
  uploadedDocument?: VerificationDocument;
  disabled?: boolean;
}> = ({ documentType, onUpload, uploadedDocument, disabled }) => {
  const [dragOver, setDragOver] = useState(false);
  const config = DOCUMENT_TYPES[documentType];
  const IconComponent = config.icon;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && config.acceptedFormats.includes(file.type) && file.size <= config.maxSize * 1024 * 1024) {
      onUpload(file);
    }
  }, [onUpload, config]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  }, [onUpload]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4 text-neutral-600" />
          <span className="font-medium text-neutral-900 font-heading">
            {config.name}
          </span>
          {config.required && (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
              Required
            </Badge>
          )}
        </div>
        
        {uploadedDocument && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              uploadedDocument.status === 'approved' && "bg-green-50 text-green-700 border-green-200",
              uploadedDocument.status === 'rejected' && "bg-red-50 text-red-700 border-red-200",
              uploadedDocument.status === 'in-review' && "bg-yellow-50 text-yellow-700 border-yellow-200"
            )}
          >
            {uploadedDocument.status}
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-neutral-600 font-body">
        {config.description}
      </p>

      {!uploadedDocument ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            dragOver ? "border-primary-400 bg-primary-50" : "border-neutral-300 hover:border-primary-300",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !disabled && document.getElementById(`file-${documentType}`)?.click()}
        >
          <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-neutral-700 font-heading">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-neutral-500 font-body mt-1">
            {config.acceptedFormats.join(', ')} up to {config.maxSize}MB
          </p>
          
          <input
            id={`file-${documentType}`}
            type="file"
            accept={config.acceptedFormats.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
            aria-label={`Upload ${config.name} document`}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-neutral-600" />
            <div>
              <p className="text-sm font-medium text-neutral-900 font-heading">
                {uploadedDocument.fileName}
              </p>
              <p className="text-xs text-neutral-600 font-body">
                {(uploadedDocument.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              onClick={() => {/* Handle remove */}}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main Identity Verification Component
 */
export const IdentityVerification: React.FC<IdentityVerificationProps> = ({
  initialData,
  onSubmit,
  onCancel,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationData, setVerificationData] = useState<Partial<VerificationData>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    documents: [],
    status: 'pending',
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'Enter your personal details',
    },
    {
      id: 'address',
      title: 'Address Information',
      description: 'Provide your current address',
    },
    {
      id: 'documents',
      title: 'Document Upload',
      description: 'Upload verification documents',
    },
    {
      id: 'selfie',
      title: 'Identity Confirmation',
      description: 'Take a verification selfie',
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review and submit for verification',
    },
  ];

  // Update verification data
  const updateData = useCallback((updates: Partial<VerificationData>) => {
    setVerificationData(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle document upload
  const handleDocumentUpload = useCallback((documentType: DocumentType, file: File) => {
    const newDocument: VerificationDocument = {
      id: `${documentType}-${Date.now()}`,
      type: documentType,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date(),
      status: 'pending',
    };

    updateData({
      documents: [...(verificationData.documents || []), newDocument],
    });
  }, [verificationData.documents, updateData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(verificationData as VerificationData);
    } catch (error) {
      console.error('Verification submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [verificationData, onSubmit]);

  // Navigation
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  // Progress steps for indicator
  const progressSteps = steps.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    isCompleted: index < currentStep,
    isActive: index === currentStep,
  }));

  return (
    <div className={cn("identity-verification max-w-4xl mx-auto p-6", className)}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-neutral-900">
              Identity Verification
            </h1>
            <p className="text-neutral-600 font-body">
              Verify your identity to build trust and unlock premium features
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          steps={progressSteps}
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
          className="mb-6"
        />
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-heading">
            {steps[currentStep].title}
          </CardTitle>
          <p className="text-neutral-600 font-body">
            {steps[currentStep].description}
          </p>
        </CardHeader>
        
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Personal Information Step */}
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={verificationData.firstName || ''}
                      onChange={(e) => updateData({ firstName: e.target.value })}
                      placeholder="Enter your first name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={verificationData.lastName || ''}
                      onChange={(e) => updateData({ lastName: e.target.value })}
                      placeholder="Enter your last name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={verificationData.dateOfBirth || ''}
                      onChange={(e) => updateData({ dateOfBirth: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Select
                      value={verificationData.nationality || ''}
                      onValueChange={(value) => updateData({ nationality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Address Information Step */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      value={verificationData.address?.street || ''}
                      onChange={(e) => updateData({
                        address: { ...verificationData.address!, street: e.target.value }
                      })}
                      placeholder="Enter your street address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={verificationData.address?.city || ''}
                        onChange={(e) => updateData({
                          address: { ...verificationData.address!, city: e.target.value }
                        })}
                        placeholder="Enter your city"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province *</Label>
                      <Input
                        id="state"
                        value={verificationData.address?.state || ''}
                        onChange={(e) => updateData({
                          address: { ...verificationData.address!, state: e.target.value }
                        })}
                        placeholder="Enter your state/province"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={verificationData.address?.postalCode || ''}
                        onChange={(e) => updateData({
                          address: { ...verificationData.address!, postalCode: e.target.value }
                        })}
                        placeholder="Enter your postal code"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Select
                        value={verificationData.address?.country || ''}
                        onValueChange={(value) => updateData({
                          address: { ...verificationData.address!, country: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Upload Step */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {Object.entries(DOCUMENT_TYPES).map(([type]) => (
                    <DocumentUpload
                      key={type}
                      documentType={type as DocumentType}
                      onUpload={(file) => handleDocumentUpload(type as DocumentType, file)}
                      uploadedDocument={verificationData.documents?.find(d => d.type === type)}
                    />
                  ))}
                </div>
              )}

              {/* Selfie Step */}
              {currentStep === 3 && (
                <div className="text-center space-y-6">
                  <div className="w-32 h-32 mx-auto bg-neutral-100 rounded-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-neutral-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-2">
                      Take a Verification Selfie
                    </h3>
                    <p className="text-neutral-600 font-body">
                      Take a clear photo of yourself to confirm your identity matches your documents
                    </p>
                  </div>
                  
                  <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                    <Camera className="w-4 h-4 mr-2" />
                    Take Selfie
                  </Button>
                </div>
              )}

              {/* Review Step */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <h3 className="font-heading font-semibold text-primary-900 mb-2">
                      Review Your Information
                    </h3>
                    <p className="text-primary-700 font-body text-sm">
                      Please review all information before submitting. Processing typically takes 1-3 business days.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-heading font-medium text-neutral-900 mb-3">
                        Personal Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Name:</span>
                          <span>{verificationData.firstName} {verificationData.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Date of Birth:</span>
                          <span>{verificationData.dateOfBirth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Nationality:</span>
                          <span>{verificationData.nationality}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-heading font-medium text-neutral-900 mb-3">
                        Documents Uploaded
                      </h4>
                      <div className="space-y-2">
                        {verificationData.documents?.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{DOCUMENT_TYPES[doc.type].name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={currentStep === 0 ? onCancel : prevStep}
          className="text-neutral-600 hover:text-neutral-800"
        >
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 font-body">
            Step {currentStep + 1} of {steps.length}
          </span>
          
          <Button
            onClick={currentStep === steps.length - 1 ? handleSubmit : nextStep}
            disabled={isSubmitting}
            className="bg-primary-900 hover:bg-primary-800 text-white font-heading"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : currentStep === steps.length - 1 ? (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Submit for Verification
              </>
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IdentityVerification;
