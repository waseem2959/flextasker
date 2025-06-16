/**
 * Shared Validation Utilities
 * 
 * Common validation functions used across payment, trust, and search components.
 * Consolidates duplicate validation logic to reduce code duplication.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  message?: string; // First error message for backward compatibility
}

/**
 * Email validation
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
};

/**
 * Phone number validation
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const errors: string[] = [];
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;

  if (!phone) {
    errors.push('Phone number is required');
  } else if (!phoneRegex.test(phone)) {
    errors.push('Please enter a valid phone number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
};

/**
 * Password validation
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
};

/**
 * Amount validation for payments
 */
export const validateAmount = (amount: number, min = 0, max = Infinity): ValidationResult => {
  const errors: string[] = [];
  
  if (isNaN(amount)) {
    errors.push('Amount must be a valid number');
  } else if (amount < min) {
    errors.push(`Amount must be at least ${min}`);
  } else if (amount > max) {
    errors.push(`Amount cannot exceed ${max}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
};

/**
 * File validation for document uploads
 */
export const validateFile = (
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf'],
  maxSizeMB = 10
): ValidationResult => {
  const errors: string[] = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors, message: 'File is required' };
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(`File size cannot exceed ${maxSizeMB}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
};

/**
 * Address validation
 */
export const validateAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): ValidationResult => {
  const errors: string[] = [];
  
  if (!address.street?.trim()) {
    errors.push('Street address is required');
  }
  
  if (!address.city?.trim()) {
    errors.push('City is required');
  }
  
  if (!address.state?.trim()) {
    errors.push('State/Province is required');
  }
  
  if (!address.postalCode?.trim()) {
    errors.push('Postal code is required');
  }
  
  if (!address.country?.trim()) {
    errors.push('Country is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
};

/**
 * Date validation
 */
export const validateDate = (date: string | Date, minAge = 18): ValidationResult => {
  const errors: string[] = [];

  if (!date) {
    errors.push('Date is required');
    return { isValid: false, errors, message: 'Date is required' };
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    errors.push('Please enter a valid date');
    return { isValid: false, errors, message: 'Please enter a valid date' };
  }
  
  // Check minimum age for date of birth
  if (minAge > 0) {
    const today = new Date();
    const age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
      if (age - 1 < minAge) {
        errors.push(`You must be at least ${minAge} years old`);
      }
    } else if (age < minAge) {
      errors.push(`You must be at least ${minAge} years old`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
};

/**
 * Text validation with length constraints
 */
export const validateText = (
  text: string,
  minLength = 0,
  maxLength = Infinity,
  fieldName = 'Field'
): ValidationResult => {
  const errors: string[] = [];

  if (!text?.trim() && minLength > 0) {
    errors.push(`${fieldName} is required`);
  } else if (text) {
    if (text.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long`);
    }
    if (text.length > maxLength) {
      errors.push(`${fieldName} cannot exceed ${maxLength} characters`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
};

/**
 * Rating validation (1-5 scale)
 */
export const validateRating = (rating: number): ValidationResult => {
  const errors: string[] = [];

  if (isNaN(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
};

/**
 * Batch validation utility
 */
export const validateFields = (validations: ValidationResult[]): ValidationResult => {
  const allErrors = validations.flatMap(v => v.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    message: allErrors.length > 0 ? allErrors[0] : undefined,
  };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return `• ${errors.join('\n• ')}`;
};
