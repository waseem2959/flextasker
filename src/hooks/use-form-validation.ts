/**
 * Form Validation Hook
 * 
 * This hook provides form validation using Zod schemas with full TypeScript
 * type safety throughout the validation and submission process.
 */

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { ValidationError } from '@/types/errors';

type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
};

type FormValidationResult<T> = {
  values: T | Record<string, any>;
  errors: Record<string, string[]>;
  hasErrors: boolean;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  validate: (data: unknown) => ValidationResult<T>;
  validateField: (field: keyof T & string, value: any) => string[] | undefined;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFieldValue: (field: keyof T & string, value: any) => void;
  setFieldTouched: (field: keyof T & string, isTouched?: boolean) => void;
  setFieldError: (field: keyof T & string, error: string | string[]) => void;
  resetForm: () => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e: React.FormEvent) => Promise<void>;
};

/**
 * Custom hook for form validation with Zod schemas
 * 
 * @param schema - Zod schema to validate against
 * @param initialValues - Initial form values
 * @returns Form validation state and handlers
 */
export function useFormValidation<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  initialValues: Partial<z.infer<typeof schema>> = {}
): FormValidationResult<z.infer<typeof schema>> {
  type FormValues = z.infer<typeof schema>;
  
  const [values, setValues] = useState<Record<string, any>>(initialValues as Record<string, any>);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validate entire form data against schema
  const validate = useCallback((data: unknown): ValidationResult<FormValues> => {
    try {
      const validData = schema.parse(data);
      return { success: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(issue.message);
        }
        
        return { success: false, errors: fieldErrors };
      }
      
      throw error;
    }
  }, [schema]);
  
  // Validate a single field
  const validateField = useCallback((field: keyof FormValues & string, value: any): string[] | undefined => {
    // Create a schema just for this field
    const fieldSchema = z.object({ [field]: schema.shape[field] });
    
    try {
      fieldSchema.parse({ [field]: value });
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues.map(issue => issue.message);
      }
      return ['An unexpected error occurred'];
    }
  }, [schema]);
  
  // Handle input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    
    // Handle different input types
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    
    setValues(prev => ({ ...prev, [name]: parsedValue }));
    
    // Clear errors when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Handle input blur (mark field as touched)
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Mark as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate on blur
    const fieldErrors = validateField(name as keyof FormValues & string, value);
    
    if (fieldErrors) {
      setErrors(prev => ({ ...prev, [name]: fieldErrors }));
    }
  }, [validateField]);
  
  // Set a field value programmatically
  const setFieldValue = useCallback((field: keyof FormValues & string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when field is modified
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Mark a field as touched programmatically
  const setFieldTouched = useCallback((field: keyof FormValues & string, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);
  
  // Set a field error programmatically
  const setFieldError = useCallback((field: keyof FormValues & string, error: string | string[]) => {
    const errorArray = Array.isArray(error) ? error : [error];
    setErrors(prev => ({ ...prev, [field]: errorArray }));
  }, []);
  
  // Reset form to initial state
  const resetForm = useCallback(() => {
    setValues(initialValues as Record<string, any>);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);
  
  // Handle form submission
  const handleSubmit = useCallback((onSubmit: (values: FormValues) => void | Promise<void>) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Mark all fields as touched
      const allTouched = Object.keys(schema.shape).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      
      setTouched(allTouched);
      
      // Validate all data
      const result = validate(values);
      
      if (!result.success) {
        setErrors(result.errors || {});
        return;
      }
      
      try {
        setIsSubmitting(true);
        await onSubmit(result.data as FormValues);
      } catch (error) {
        if (error instanceof ValidationError) {
          setErrors(error.fieldErrors);
        } else {
          console.error('Form submission error:', error);
        }
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [schema, validate, values]);
  
  return {
    values: values as FormValues,
    errors,
    hasErrors: Object.keys(errors).length > 0,
    touched,
    isSubmitting,
    validate,
    validateField,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    resetForm,
    handleSubmit
  };
}
