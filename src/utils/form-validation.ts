/**
 * Form Validation Utilities
 * 
 * Centralized utilities for form validation that integrate with our error handling system.
 * This module provides standardized validation functions, error formatting, and integration
 * with the application's error system.
 */

import { ValidationError } from '@/types/errors';
import { useCallback, useState } from 'react';
// Error logging removed for simplicity

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /**
   * Whether the validation passed
   */
  valid: boolean;
  
  /**
   * Error message if validation failed
   */
  message?: string;
  
  /**
   * Field name that failed validation
   */
  field?: string;
  
  /**
   * Additional context for the error
   */
  context?: Record<string, any>;
}

/**
 * Map of field errors
 */
export type FieldErrors<T> = Partial<Record<keyof T, string[]>>;

/**
 * Result of validating a form
 */
export interface FormValidationResult<T> {
  /**
   * Whether the validation passed
   */
  valid: boolean;
  
  /**
   * Map of field errors
   */
  errors: FieldErrors<T>;
  
  /**
   * Get all errors as a flat array of messages
   */
  getErrorMessages: () => string[];
  
  /**
   * Get validation error instance
   */
  getValidationError: () => ValidationError;
  
  /**
   * Add an error for a field
   */
  addError: <K extends keyof T>(field: K, message: string) => void;
  
  /**
   * Check if a field has errors
   */
  hasError: <K extends keyof T>(field: K) => boolean;
  
  /**
   * Get errors for a field
   */
  getFieldErrors: <K extends keyof T>(field: K) => string[];
}

/**
 * Options for a validation function
 */
export interface ValidationOptions {
  /**
   * Whether to trim string values before validation
   * @default true
   */
  trim?: boolean;
  
  /**
   * Custom error message
   */
  message?: string;
  
  /**
   * Additional context for the error
   */
  context?: Record<string, any>;
  
  /**
   * Whether the field is required
   * @default true
   */
  required?: boolean;
}

/**
 * Validation function type
 */
export type ValidatorFn<T = any> = (
  value: T,
  options?: ValidationOptions
) => ValidationResult;

/**
 * Asynchronous validation function type
 */
export type AsyncValidatorFn<T = any> = (
  value: T,
  options?: ValidationOptions
) => Promise<ValidationResult>;

/**
 * Create a validation result
 */
export function createValidationResult(
  valid: boolean,
  message?: string,
  field?: string,
  context?: Record<string, any>
): ValidationResult {
  return {
    valid,
    message,
    field,
    context
  };
}

/**
 * Create a form validation result
 */
export function createFormValidationResult<T>(
  initialErrors: FieldErrors<T> = {}
): FormValidationResult<T> {
  const errors: FieldErrors<T> = { ...initialErrors };
  
  // Check if any errors exist
  const hasErrors = (): boolean => {
    return Object.values(errors).some(fieldErrors =>
      Array.isArray(fieldErrors) && fieldErrors.length > 0
    );
  };

  // Get all error messages as a flat array
  const getErrorMessages = (): string[] => {
    return Object.values(errors).flatMap(fieldErrors =>
      Array.isArray(fieldErrors) ? fieldErrors : []
    );
  };
  
  // Create a ValidationError instance
  const getValidationError = (): ValidationError => {
    const formattedErrors: Record<string, string[]> = {};
    
    // Convert from FieldErrors<T> to Record<string, string[]>
    Object.entries(errors).forEach(([key, value]) => {
      if (value && Array.isArray(value) && value.length > 0) {
        formattedErrors[key] = value;
      }
    });
    
    return new ValidationError(
      'Form validation failed',
      formattedErrors
    );
  };
  
  // Add an error for a field
  const addError = <K extends keyof T>(field: K, message: string): void => {
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field]!.push(message);
  };
  
  // Check if a field has errors
  const hasError = <K extends keyof T>(field: K): boolean => {
    return Boolean(errors[field] && errors[field]?.length > 0);
  };
  
  // Get errors for a field
  const getFieldErrors = <K extends keyof T>(field: K): string[] => {
    return errors[field] || [];
  };
  
  return {
    valid: !hasErrors(),
    errors,
    getErrorMessages,
    getValidationError,
    addError,
    hasError,
    getFieldErrors
  };
}

/**
 * Required field validator
 */
export const required: ValidatorFn = (value, options = {}) => {
  const { message = 'This field is required', context } = options;
  
  // Check different types of values
  const isEmpty = 
    value === undefined || 
    value === null || 
    value === '' || 
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0);
  
  return createValidationResult(!isEmpty, isEmpty ? message : undefined, undefined, context);
};

/**
 * Minimum length validator
 */
export const minLength = (min: number): ValidatorFn<string> => (value, options = {}) => {
  const { 
    trim = true, 
    message = `Must be at least ${min} characters`, 
    context,
    required: isRequired = true
  } = options;
  
  // Handle empty values based on required flag
  if ((value === undefined || value === null || value === '') && !isRequired) {
    return createValidationResult(true);
  }
  
  const strValue = String(value || '');
  const trimmedValue = trim ? strValue.trim() : strValue;
  const valid = trimmedValue.length >= min;
  
  return createValidationResult(valid, valid ? undefined : message, undefined, context);
};

/**
 * Maximum length validator
 */
export const maxLength = (max: number): ValidatorFn<string> => (value, options = {}) => {
  const { 
    trim = true, 
    message = `Must be no more than ${max} characters`, 
    context,
    required: isRequired = true
  } = options;
  
  // Handle empty values based on required flag
  if ((value === undefined || value === null || value === '') && !isRequired) {
    return createValidationResult(true);
  }
  
  const strValue = String(value || '');
  const trimmedValue = trim ? strValue.trim() : strValue;
  const valid = trimmedValue.length <= max;
  
  return createValidationResult(valid, valid ? undefined : message, undefined, context);
};

/**
 * Email validator
 */
export const email: ValidatorFn<string> = (value, options = {}) => {
  const { 
    trim = true, 
    message = 'Please enter a valid email address', 
    context,
    required: isRequired = true
  } = options;
  
  // Handle empty values based on required flag
  if ((value === undefined || value === null || value === '') && !isRequired) {
    return createValidationResult(true);
  }
  
  const trimmedValue = trim ? (value || '').trim() : (value || '');
  // RFC 5322 Official Standard Email Regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  const valid = emailRegex.test(trimmedValue);
  
  return createValidationResult(valid, valid ? undefined : message, undefined, context);
};

/**
 * URL validator
 */
export const url: ValidatorFn<string> = (value, options = {}) => {
  const { 
    trim = true, 
    message = 'Please enter a valid URL', 
    context,
    required: isRequired = true
  } = options;
  
  // Handle empty values based on required flag
  if ((value === undefined || value === null || value === '') && !isRequired) {
    return createValidationResult(true);
  }
  
  const trimmedValue = trim ? (value || '').trim() : (value || '');
  
  try {
    new URL(trimmedValue);
    return createValidationResult(true, undefined, undefined, context);
  } catch (error) {
    return createValidationResult(false, message, undefined, context);
  }
};

/**
 * Pattern validator
 */
export const pattern = (regex: RegExp, patternDescription?: string): ValidatorFn<string> => 
  (value, options = {}) => {
    const { 
      trim = true, 
      message, 
      context,
      required: isRequired = true
    } = options;
    
    // Handle empty values based on required flag
    if ((value === undefined || value === null || value === '') && !isRequired) {
      return createValidationResult(true);
    }
    
    const trimmedValue = trim ? (value || '').trim() : (value || '');
    const valid = regex.test(trimmedValue);
    
    const defaultMessage = patternDescription 
      ? `Must match format: ${patternDescription}`
      : 'Invalid format';
    
    return createValidationResult(
      valid, 
      valid ? undefined : (message ?? defaultMessage), 
      undefined, 
      context
    );
  };

/**
 * Number range validator
 */
export const numberRange = (min?: number, max?: number): ValidatorFn<number> => 
  (value, options = {}) => {
    const { 
      message, 
      context,
      required: isRequired = true
    } = options;
    
    // Handle empty values based on required flag
    if ((value === undefined || value === null || String(value) === '') && !isRequired) {
      return createValidationResult(true);
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      return createValidationResult(false, 'Must be a valid number', undefined, context);
    }
    
    let valid = true;
    let errorMessage = '';
    
    if (min !== undefined && max !== undefined) {
      valid = numValue >= min && numValue <= max;
      errorMessage = `Must be between ${min} and ${max}`;
    } else if (min !== undefined) {
      valid = numValue >= min;
      errorMessage = `Must be at least ${min}`;
    } else if (max !== undefined) {
      valid = numValue <= max;
      errorMessage = `Must be no more than ${max}`;
    }
    
    return createValidationResult(
      valid, 
      valid ? undefined : (message ?? errorMessage), 
      undefined, 
      context
    );
  };

/**
 * Match another field validator
 */
export const matches = <T>(otherValue: T, otherFieldName?: string): ValidatorFn<T> => 
  (value, options = {}) => {
    const { 
      message, 
      context,
      required: isRequired = true
    } = options;
    
    // Handle empty values based on required flag
    if ((value === undefined || value === null || value === '') && !isRequired) {
      return createValidationResult(true);
    }
    
    const valid = value === otherValue;
    const fieldText = otherFieldName ? ` ${otherFieldName}` : '';
    const defaultMessage = `Must match${fieldText}`;
    
    return createValidationResult(
      valid, 
      valid ? undefined : (message ?? defaultMessage), 
      undefined, 
      context
    );
  };

/**
 * Date range validator
 */
export const dateRange = (
  minDate?: Date | string | number,
  maxDate?: Date | string | number
): ValidatorFn<Date | string | number> => (value, options = {}) => {
  const { 
    message, 
    context,
    required: isRequired = true
  } = options;
  
  // Handle empty values based on required flag
  if ((value === undefined || value === null || value === '') && !isRequired) {
    return createValidationResult(true);
  }
  
  // Convert all values to Date objects
  const valueDate = new Date(value);
  const minDateObj = minDate ? new Date(minDate) : undefined;
  const maxDateObj = maxDate ? new Date(maxDate) : undefined;
  
  if (isNaN(valueDate.getTime())) {
    return createValidationResult(false, 'Must be a valid date', undefined, context);
  }
  
  let valid = true;
  let errorMessage = '';
  
  if (minDateObj && maxDateObj) {
    valid = valueDate >= minDateObj && valueDate <= maxDateObj;
    errorMessage = `Must be between ${minDateObj.toLocaleDateString()} and ${maxDateObj.toLocaleDateString()}`;
  } else if (minDateObj) {
    valid = valueDate >= minDateObj;
    errorMessage = `Must be on or after ${minDateObj.toLocaleDateString()}`;
  } else if (maxDateObj) {
    valid = valueDate <= maxDateObj;
    errorMessage = `Must be on or before ${maxDateObj.toLocaleDateString()}`;
  }
  
  return createValidationResult(
    valid, 
    valid ? undefined : (message ?? errorMessage), 
    undefined, 
    context
  );
};

/**
 * Custom validator
 */
export const custom = <T>(validatorFn: (value: T) => boolean, errorMessage: string): ValidatorFn<T> => 
  (value, options = {}) => {
    const { 
      context,
      required: isRequired = true
    } = options;
    
    // Handle empty values based on required flag
    if ((value === undefined || value === null || value === '') && !isRequired) {
      return createValidationResult(true);
    }
    
    const valid = validatorFn(value);
    
    return createValidationResult(
      valid, 
      valid ? undefined : (options.message ?? errorMessage), 
      undefined, 
      context
    );
  };

/**
 * Compose multiple validators
 */
export const compose = <T>(validators: ValidatorFn<T>[]): ValidatorFn<T> => 
  (value, options = {}) => {
    for (const validator of validators) {
      const result = validator(value, options);
      
      if (!result.valid) {
        return result;
      }
    }
    
    return createValidationResult(true);
  };

/**
 * Validate an object using a validation schema
 */
export function validateObject<T extends Record<string, any>>(
  values: T,
  schema: Record<keyof T, ValidatorFn | ValidatorFn[]>
): FormValidationResult<T> {
  const result = createFormValidationResult<T>();
  
  Object.entries(schema).forEach(([key, validators]) => {
    const field = key as keyof T;
    const value = values[field];
    const validatorList = Array.isArray(validators) ? validators : [validators];
    
    for (const validator of validatorList) {
      const validationResult = validator(value);
      
      if (!validationResult.valid) {
        result.addError(field, validationResult.message ?? 'Invalid value');
        break; // Stop on first error for this field
      }
    }
  });
  
  return result;
}

/**
 * Validate a form using a validation schema (async version)
 */
export async function validateObjectAsync<T extends Record<string, any>>(
  values: T,
  schema: Record<keyof T, ValidatorFn | ValidatorFn[] | AsyncValidatorFn | AsyncValidatorFn[]>
): Promise<FormValidationResult<T>> {
  const result = createFormValidationResult<T>();
  
  const validationPromises = Object.entries(schema).map(async ([key, validators]) => {
    const field = key as keyof T;
    const value = values[field];
    const validatorList = Array.isArray(validators) ? validators : [validators];
    
    for (const validator of validatorList) {
      try {
        const validationResult = await validator(value);
        
        if (!validationResult.valid) {
          result.addError(field, validationResult.message ?? 'Invalid value');
          break; // Stop on first error for this field
        }
      } catch (error) {
        // Log validation errors
        console.error('form_validation_error', error instanceof Error ? error : String(error), {
          field: String(field),
          value: typeof value === 'object' ? 'Object' : String(value)
        });
        
        result.addError(field, 'Validation failed');
        break;
      }
    }
  });
  
  await Promise.all(validationPromises);
  
  return result;
}

/**
 * Create a form submission handler with validation
 */
export function createFormSubmitHandler<T extends Record<string, any>>(
  onSubmit: (values: T) => void | Promise<void>,
  validationSchema: Record<keyof T, ValidatorFn | ValidatorFn[]>,
  onValidationError?: (error: ValidationError) => void
): (values: T) => Promise<void> {
  return async (values: T) => {
    try {
      // Validate form data
      const validationResult = validateObject(values, validationSchema);
      
      if (!validationResult.valid) {
        const validationError = validationResult.getValidationError();
        
        if (onValidationError) {
          onValidationError(validationError);
        }
        
        // Log validation error
        console.error('form_validation_error', validationError, {
          fields: Object.keys(validationResult.errors)
        });
        
        return;
      }
      
      // Call the original submit handler
      await onSubmit(values);
    } catch (error) {
      // Handle any errors during submission
      console.error('form_submission_error', error instanceof Error ? error : String(error), {
        formData: JSON.stringify(values)
      });
      
      throw error;
    }
  };
}

// CONSOLIDATED VALIDATION RULES (from use-form-validation.ts)
// Simple validation rules for quick use
export const ValidationRules = {
  required: (message = 'This field is required') =>
    (value: any) => (value === undefined || value === null || value === '') ? message : null,

  min: (min: number, message = `Must be at least ${min}`) =>
    (value: number) => (value < min) ? message : null,

  max: (max: number, message = `Must be at most ${max}`) =>
    (value: number) => (value > max) ? message : null,

  minLength: (minLength: number, message = `Must be at least ${minLength} characters`) =>
    (value: string) => (value.length < minLength) ? message : null,

  maxLength: (maxLength: number, message = `Must be at most ${maxLength} characters`) =>
    (value: string) => (value.length > maxLength) ? message : null,

  pattern: (pattern: RegExp, message = 'Invalid format') =>
    (value: string) => (!pattern.test(value)) ? message : null,

  email: (message = 'Invalid email address') =>
    (value: string) => (!/^\S+@\S+\.\S+$/.test(value)) ? message : null,

  matches: (field: string, message = 'Fields must match') =>
    (value: any, formValues?: Record<string, any>) =>
      (formValues && formValues[field] !== value) ? message : null,
};

// Hook-style validation for React components
export function useFormValidation<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback((_name: keyof T, value: any, rules: Array<(value: any, formValues?: T) => string | null>) => {
    for (const rule of rules) {
      const error = rule(value, values);
      if (error) {
        return error;
      }
    }
    return null;
  }, [values]);

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setFieldTouched = useCallback((name: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string | null) => {
    setErrors(prev => ({ ...prev, [name]: error || undefined }));
  }, []);

  const validateForm = useCallback((validationRules: Partial<Record<keyof T, Array<(value: any, formValues?: T) => string | null>>>) => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach(key => {
      const fieldName = key as keyof T;
      const rules = validationRules[fieldName];
      if (rules) {
        const error = validateField(fieldName, values[fieldName], rules);
        if (error) {
          newErrors[fieldName] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    validateField,
    validateForm,
    resetForm,
    isValid: Object.keys(errors).length === 0
  };
}

export default {
  required,
  minLength,
  maxLength,
  email,
  url,
  pattern,
  numberRange,
  matches,
  dateRange,
  custom,
  compose,
  validateObject,
  validateObjectAsync,
  createFormSubmitHandler,
  createFormValidationResult,
  createValidationResult,
  ValidationRules,
  useFormValidation
};
