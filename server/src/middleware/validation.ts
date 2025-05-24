import { ValidationError } from '@/utils/errors';
import { NextFunction, Request, Response } from 'express';
import { FieldValidationError, ValidationChain, validationResult } from 'express-validator';

/**
 * Validation middleware - this is like having a quality control inspector
 * who checks that all incoming data meets our standards before we process it.
 * 
 * It uses express-validator to check things like email format, password strength,
 * required fields, etc.
 */

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
 * 
 * We use 'unknown' instead of 'any' because it forces us to check the type
 * before using it, which is exactly what a type guard should do.
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
 * 
 * Note: We prefix unused parameters with underscore to indicate they're
 * intentionally not used, while still maintaining the Express middleware signature.
 */
export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Transform validation errors into our standardized format
    const errorDetails: ValidationErrorDetail[] = errors.array().map(error => {
      // Handle different types of validation errors safely
      if (isFieldValidationError(error)) {
        return {
          field: error.path || 'unknown',
          message: error.msg ?? 'Validation failed',
          value: error.value,
          location: error.location || 'body',
        };
      } else {
        // Handle alternative validation errors (like custom validators)
        return {
          field: 'unknown',
          message: error.msg ?? 'Validation failed',
          value: undefined,
          location: 'unknown',
        };
      }
    });
    
    // Throw our custom validation error with detailed information
    throw new ValidationError('Validation failed', errorDetails);
  }
  
  next();
};

/**
 * Create a validation middleware chain that runs validations and handles errors
 * 
 * This is like setting up a complete inspection process - first we run all
 * the individual checks, then we examine the results and decide whether
 * to proceed or report problems.
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Run all validations in parallel for better performance
      // This is like having multiple inspectors check different aspects simultaneously
      await Promise.all(validations.map(validation => validation.run(req)));
      
      // Check for validation errors after all validations complete
      handleValidationErrors(req, res, next);
    } catch (error) {
      // Pass any errors to the error handling middleware
      next(error);
    }
  };
};

/**
 * Helper function to create consistent validation error responses
 * 
 * This ensures that validation errors are always formatted in a user-friendly way
 * that frontend applications can easily understand and display to users.
 */
export const formatValidationErrors = (errorDetails: ValidationErrorDetail[]): Record<string, string[]> => {
  const formattedErrors: Record<string, string[]> = {};
  
  errorDetails.forEach(detail => {
    if (!formattedErrors[detail.field]) {
      formattedErrors[detail.field] = [];
    }
    formattedErrors[detail.field].push(detail.message);
  });
  
  return formattedErrors;
};

/**
 * Validation middleware specifically for request body validation
 * 
 * This is a convenience function for the most common use case - validating
 * data that comes in the request body (like form submissions or API calls).
 */
export const validateBody = (validations: ValidationChain[]) => {
  return validate(validations);
};

/**
 * Validation middleware specifically for query parameter validation
 * 
 * This handles validation of URL query parameters (like ?page=1&limit=10)
 * which often have different validation requirements than body data.
 */
export const validateQuery = (validations: ValidationChain[]) => {
  return validate(validations);
};

/**
 * Validation middleware specifically for URL parameter validation
 * 
 * This validates dynamic parts of URLs (like /users/:userId) to ensure
 * they meet format requirements before we try to use them.
 */
export const validateParams = (validations: ValidationChain[]) => {
  return validate(validations);
};