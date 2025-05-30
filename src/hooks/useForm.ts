/**
 * Form Hooks
 * 
 * This module provides form utilities that work with both react-hook-form
 * and our custom Zod validation system.
 */

import React, { useContext, useState, useCallback } from "react";
import {
  FieldPath,
  FieldValues,
  useFormContext,
} from "react-hook-form";
import { z } from 'zod';
import { ValidationError } from '@/types/errors';

// Form Field Context

/**
 * Context for FormField
 */
export interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
}

export const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

/**
 * Context for FormItem
 */
export interface FormItemContextValue {
  id: string;
}

export const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

/**
 * Hook for working with form fields in the context of a FormField component
 * Provides field state and accessibility attributes
 */
export function useFormField() {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

// Form Validation

/**
 * Validation result with success status and optional data/errors
 */
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
};

/**
 * Form validation result with values, errors, and helper methods
 */
export type FormValidationResult<T> = {
  values: T | Record<string, any>;
  errors: Record<string, string[]>;
  hasErrors: boolean;
  touched: Record<string, boolean>;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (onSuccess: (data: T) => void) => (e: React.FormEvent) => void;
  setValues: (values: Partial<T>) => void;
  setValue: (field: keyof T, value: any) => void;
  reset: () => void;
  validate: (field?: keyof T) => boolean;
  getInputProps: (field: keyof T) => {
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    error: string[] | undefined;
  };
};

/**
 * Custom hook for form validation with Zod schemas
 * 
 * @param schema - Zod schema to validate against
 * @param initialValues - Initial form values
 * @returns Form validation state and handlers
 */
export function useFormValidation<T extends z.ZodObject<any>>(
  schema: T,
  initialValues: Partial<z.infer<typeof schema>> = {}
): FormValidationResult<z.infer<typeof schema>> {
  type FormValues = z.infer<typeof schema>;
  
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  /**
   * Validate the entire form or a specific field
   */
  const validate = useCallback(
    (field?: keyof FormValues): boolean => {
      try {
        if (field) {
          // Validate a specific field
          const fieldSchema = schema.shape[field as string];
          const result = fieldSchema.safeParse(values[field as string]);
          
          if (!result.success) {
            const fieldErrors: string[] = [];
            
            if (result.error instanceof z.ZodError) {
              result.error.errors.forEach((err: z.ZodIssue) => {
                fieldErrors.push(err.message);
              });
            }
            
            setErrors((prev) => ({
              ...prev,
              [field]: fieldErrors,
            }));
            
            return false;
          } else {
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[field as string];
              return newErrors;
            });
            
            return true;
          }
        } else {
          // Validate the entire form
          const result = schema.safeParse(values);
          
          if (!result.success) {
            const validationErrors: Record<string, string[]> = {};
            
            result.error.errors.forEach((err) => {
              const path = err.path[0] as string;
              
              if (!validationErrors[path]) {
                validationErrors[path] = [];
              }
              
              validationErrors[path].push(err.message);
            });
            
            setErrors(validationErrors);
            return false;
          } else {
            setErrors({});
            return true;
          }
        }
      } catch (error) {
        console.error('Validation error:', error);
        return false;
      }
    },
    [schema, values]
  );
  
  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (field: keyof FormValues, value: any) => {
      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));
      
      if (touched[field as string]) {
        validate(field);
      }
    },
    [touched, validate]
  );
  
  /**
   * Handle input blur
   */
  const handleBlur = useCallback(
    (field: keyof FormValues) => {
      setTouched((prev) => ({
        ...prev,
        [field]: true,
      }));
      
      validate(field);
    },
    [validate]
  );
  
  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (onSuccess: (data: FormValues) => void) => (e: React.FormEvent) => {
      e.preventDefault();
      
      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      Object.keys(schema.shape).forEach((key) => {
        allTouched[key] = true;
      });
      setTouched(allTouched);
      
      const isValid = validate();
      
      if (isValid) {
        onSuccess(values as FormValues);
      } else {
        throw new ValidationError('Form validation failed', errors);
      }
    },
    [errors, schema.shape, validate, values]
  );
  
  /**
   * Set multiple values at once
   */
  const setFormValues = useCallback(
    (newValues: Partial<FormValues>) => {
      setValues((prev) => ({
        ...prev,
        ...newValues,
      }));
    },
    []
  );
  
  /**
   * Set a single value
   */
  const setValue = useCallback(
    (field: keyof FormValues, value: any) => {
      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );
  
  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialValues as Record<string, any>);
    setErrors({});
    setTouched({});
  }, [initialValues]);
  
  /**
   * Get input props for a field
   */
  const getInputProps = useCallback(
    (field: keyof FormValues) => ({
      name: field as string,
      value: values[field as string] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(field, e.target.value),
      onBlur: () => handleBlur(field),
      error: errors[field as string],
    }),
    [errors, handleBlur, handleChange, values]
  );
  
  return {
    values: values as FormValues,
    errors,
    hasErrors: Object.keys(errors).length > 0,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues: setFormValues,
    setValue,
    reset,
    validate,
    getInputProps,
  };
}
