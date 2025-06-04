/**
 * Form Validation Hook
 * 
 * This hook provides a flexible and type-safe way to handle form validation
 * with support for synchronous and asynchronous validation rules.
 */

import { useCallback, useEffect, useState } from 'react';

/**
 * Validation rule function type
 * Returns an error message string if validation fails, or null if it passes
 */
export type ValidationRule<T> = (
  value: T,
  formValues?: Record<string, any>
) => string | null | Promise<string | null>;

/**
 * Validation rules configuration
 * Maps field names to their validation rules
 */
export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

/**
 * Validation errors result
 * Maps field names to their error messages
 */
export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

/**
 * Touch state for form fields
 * Maps field names to a boolean indicating if they've been touched
 */
export type TouchedFields<T> = {
  [K in keyof T]?: boolean;
};

/**
 * Form validation hook options
 */
export interface UseFormValidationOptions<T> {
  initialValues: T;
  validationRules: ValidationRules<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
}

/**
 * Form validation hook return type
 */
export interface UseFormValidationReturn<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: TouchedFields<T>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldTouched: <K extends keyof T>(field: K, isTouched?: boolean) => void;
  setFieldError: <K extends keyof T>(field: K, error: string | null) => void;
  validateField: <K extends keyof T>(field: K) => Promise<string | null>;
  validateForm: () => Promise<boolean>;
  resetForm: (newValues?: T) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => Promise<void>;
  getFieldProps: <K extends keyof T>(field: K) => {
    name: string;
    value: T[K];
    onChange: (e: React.ChangeEvent<any>) => void;
    onBlur: () => void;
  };
}

/**
 * Form validation hook
 * 
 * @example
 * const { 
 *   values, errors, touched, isValid, 
 *   setFieldValue, getFieldProps, handleSubmit 
 * } = useFormValidation({
 *   initialValues: { name: '', email: '', password: '' },
 *   validationRules: {
 *     name: [(value) => value ? null : 'Name is required'],
 *     email: [
 *       (value) => value ? null : 'Email is required',
 *       (value) => /^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email'
 *     ],
 *     password: [
 *       (value) => value ? null : 'Password is required',
 *       (value) => value.length >= 8 ? null : 'Password must be at least 8 characters'
 *     ]
 *   }
 * });
 */
export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  validateOnChange = true,
  validateOnBlur = true,
  validateOnSubmit = true,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<TouchedFields<T>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  /**
   * Check if the form is valid
   */
  const isValid = useCallback(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  /**
   * Set the value of a specific field
   */
  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prevValues => ({
      ...prevValues,
      [field]: value,
    }));
    setIsDirty(true);
  }, []);

  /**
   * Set the touched state of a specific field
   */
  const setFieldTouched = useCallback(<K extends keyof T>(field: K, isTouched: boolean = true) => {
    setTouched(prevTouched => ({
      ...prevTouched,
      [field]: isTouched,
    }));
  }, []);

  /**
   * Set the error of a specific field
   */
  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setErrors(prevErrors => {
      if (error === null) {
        const { [field]: _, ...rest } = prevErrors;
        return rest as ValidationErrors<T>;
      } else {
        return {
          ...prevErrors,
          [field]: error,
        };
      }
    });
  }, []);

  /**
   * Validate a specific field
   */
  const validateField = useCallback(async <K extends keyof T>(field: K): Promise<string | null> => {
    const fieldRules = validationRules[field];
    if (!fieldRules || fieldRules.length === 0) {
      setFieldError(field, null);
      return null;
    }

    const value = values[field];
    
    // Run all validation rules for the field
    for (const rule of fieldRules) {
      try {
        const result = await rule(value, values);
        if (result) {
          setFieldError(field, result);
          return result;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Validation error';
        setFieldError(field, errorMessage);
        return errorMessage;
      }
    }
    
    // All rules passed, clear any existing error
    setFieldError(field, null);
    return null;
  }, [values, validationRules, setFieldError]);

  /**
   * Validate the entire form
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    
    const fieldNames = Object.keys(validationRules) as Array<keyof T>;
    const validationPromises = fieldNames.map(field => validateField(field));
    
    try {
      const results = await Promise.all(validationPromises);
      const isValid = results.every(result => result === null);
      setIsValidating(false);
      return isValid;
    } catch (error) {
      setIsValidating(false);
      return false;
    }
  }, [validateField, validationRules]);

  /**
   * Reset the form to its initial state
   */
  const resetForm = useCallback((newValues?: T) => {
    setValues(newValues ?? initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialValues]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => {
    return async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      
      setIsSubmitting(true);
      
      // Validate all fields if validateOnSubmit is true
      let canSubmit = true;
      if (validateOnSubmit) {
        canSubmit = await validateForm();
      }
      
      if (canSubmit) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }
      
      setIsSubmitting(false);
    };
  }, [validateForm, validateOnSubmit, values]);

  /**
   * Get props for a field
   */
  const getFieldProps = useCallback(<K extends keyof T>(field: K) => {
    return {
      name: String(field),
      value: values[field],
      onChange: (e: React.ChangeEvent<any>) => {
        const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFieldValue(field, newValue);
      },
      onBlur: () => {
        setFieldTouched(field, true);
      },
    };
  }, [values, setFieldValue, setFieldTouched]);

  /**
   * Validate fields on change if validateOnChange is true
   */
  useEffect(() => {
    if (validateOnChange && isDirty) {
      const debouncedValidation = setTimeout(() => {
        Object.keys(touched)
          .filter(field => touched[field as keyof T])
          .forEach(field => {
            validateField(field as keyof T);
          });
      }, 300);
      
      return () => clearTimeout(debouncedValidation);
    }
  }, [values, touched, validateOnChange, isDirty, validateField]);

  /**
   * Validate fields on blur if validateOnBlur is true
   */
  useEffect(() => {
    if (validateOnBlur) {
      Object.keys(touched)
        .filter(field => touched[field as keyof T])
        .forEach(field => {
          validateField(field as keyof T);
        });
    }
  }, [touched, validateOnBlur, validateField]);

  return {
    values,
    errors,
    touched,
    isValid: isValid(),
    isDirty,
    isSubmitting,
    isValidating,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    validateField,
    validateForm,
    resetForm,
    handleSubmit,
    getFieldProps,
  };
}

/**
 * Common validation rules
 */
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

export default useFormValidation;
