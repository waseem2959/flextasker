import React from 'react';

/**
 * Form field context interface
 */
export interface FormFieldContextValue {
  id: string;
  name: string;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
}

/**
 * Form item context interface
 */
export interface FormItemContextValue {
  id: string;
}

/**
 * Form field context
 */
export const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(undefined);

/**
 * Form item context
 */
export const FormItemContext = React.createContext<FormItemContextValue | undefined>(undefined);

/**
 * Hook to use form field context
 */
export function useFormField() {  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext || {};
  
  // Get react-hook-form's state
  const fieldState: { error?: { message?: string } } = {};
  const error = fieldState?.error;

  return {
    id,
    name: fieldContext.name,
    formItemId: fieldContext.formItemId,
    formDescriptionId: fieldContext.formDescriptionId,
    formMessageId: fieldContext.formMessageId,
    error,
  };
}

/**
 * Form field props
 */
export interface FormFieldProps {
  name: string;
  children: React.ReactNode;
}

/**
 * Form field provider component
 */
export function FormFieldProvider({ name, children }: FormFieldProps) {
  const id = React.useId();
  
  const contextValue: FormFieldContextValue = {
    id,
    name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  };

  return React.createElement(
    FormFieldContext.Provider,
    { value: contextValue },
    children
  );
}

/**
 * Form item provider component
 */
export function FormItemProvider({ children }: { children: React.ReactNode }) {
  const id = React.useId();
  
  return React.createElement(
    FormItemContext.Provider,
    { value: { id } },
    children
  );
}

/**
 * Get form field state utilities
 */
export function useFormFieldState() {
  
  return {
    invalid: false, // This would be connected to actual form validation
    isDirty: false,
    isTouched: false,
    error: undefined,
  };
}

/**
 * Form control props interface
 */
export interface UseFormControlProps {
  id?: string;
  name?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

/**
 * Hook to get form control props
 */
export function useFormControl(): UseFormControlProps {
  const field = useFormField();
  const state = useFormFieldState();

  return {
    id: field.formItemId,
    name: field.name,
    'aria-describedby': field.formDescriptionId,
    'aria-invalid': state.invalid,
  };
}

/**
 * Form validation result
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Basic form validation utilities
 */
export const formValidationUtils = {
  /**
   * Validate required field
   */
  required: (value: any, message = 'This field is required') => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  },

  /**
   * Validate email format
   */
  email: (value: string, message = 'Please enter a valid email address') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return message;
    }
    return null;
  },

  /**
   * Validate minimum length
   */
  minLength: (value: string, min: number, message?: string) => {
    if (value && value.length < min) {
      return message ?? `Must be at least ${min} characters`;
    }
    return null;
  },

  /**
   * Validate maximum length
   */
  maxLength: (value: string, max: number, message?: string) => {
    if (value && value.length > max) {
      return message ?? `Must be no more than ${max} characters`;
    }
    return null;
  },

  /**
   * Validate pattern match
   */
  pattern: (value: string, regex: RegExp, message = 'Invalid format') => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },
};
