/**
 * Validation Middleware
 * 
 * This middleware provides request validation functionality using express-validator.
 * It validates incoming request data (body, query parameters, URL parameters)
 * and provides standardized error responses.
 */

import { ValidationError } from '../utils/error-utils';
import { NextFunction, Request, Response } from 'express';
import { FieldValidationError, ValidationChain, validationResult } from 'express-validator';

/**
 * Interface for standardized validation error details
 * This ensures consistency in how we report validation errors across the application
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
  location?: string;
}

/**
 * Type guard to check if an error is a field validation error
 * This helps us safely access properties that might not exist on all error types
 */
function isFieldValidationError(error: unknown): error is FieldValidationError {
  return Boolean(error && typeof error === 'object' && error !== null && 'path' in error);
}

/**
 * Process validation results and throw error if validation fails
 * 
 * This function acts like a quality control checkpoint. It examines all the
 * validation results and either gives the green light to proceed or stops
 * the process with detailed information about what went wrong.
 */
export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Extract detailed error information
    const errorDetails: ValidationErrorDetail[] = errors.array().map(error => {
      if (isFieldValidationError(error)) {
        return {
          field: error.path,
          message: error.msg,
          value: error.value,
          location: error.location
        };
      } else {
        return {
          field: 'unknown',
          message: error.msg ?? 'Unknown validation error'
        };
      }
    });

    // Create a validation error with formatted details
    const formattedErrors = formatValidationErrors(errorDetails);
    const validationError = new ValidationError('Validation failed', formattedErrors);
    
    // Pass the error to the next middleware (which should be the error handler)
    next(validationError);
    return;
  }
  
  // If validation passes, continue to the next middleware/controller
  next();
};

/**
 * Create a validation middleware chain that runs validations and handles errors
 * 
 * This is like setting up a complete inspection process - first we run all
 * the individual checks, then we examine the results and decide whether
 * to proceed or report problems.
 */
export function validate(validations: ValidationChain[]) {
  return [
    // First run all validations
    ...validations,
    // Then check if any validations failed
    handleValidationErrors
  ];
}

/**
 * Helper function to create consistent validation error responses
 * 
 * This ensures that validation errors are always formatted in a user-friendly way
 * that frontend applications can easily understand and display to users.
 */
export function formatValidationErrors(errorDetails: ValidationErrorDetail[]): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};
  
  errorDetails.forEach(error => {
    const field = error.field;
    
    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }
    
    formattedErrors[field].push(error.message);
  });
  
  return formattedErrors;
}

/**
 * Validation middleware specifically for request body validation
 * 
 * This is a convenience function for the most common use case - validating
 * data that comes in the request body (like form submissions or API calls).
 */
export function validateBody(validations: ValidationChain[]) {
  return validate(validations);
}

/**
 * Validation middleware specifically for query parameter validation
 * 
 * This handles validation of URL query parameters (like ?page=1&limit=10)
 * which often have different validation requirements than body data.
 */
export function validateQuery(validations: ValidationChain[]) {
  return validate(validations);
}

/**
 * Validation middleware specifically for URL parameter validation
 * 
 * This validates dynamic parts of URLs (like /users/:userId) to ensure
 * they meet format requirements before we try to use them.
 */
export function validateParams(validations: ValidationChain[]) {
  return validate(validations);
}
