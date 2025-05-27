/**
 * Validation Middleware Module
 * 
 * This module provides middleware for validating request data.
 * It leverages express-validator for validation rules and provides
 * a standardized approach to handling validation errors.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../utils/enhanced-errors';
import { ValidationChain, validationResult } from 'express-validator';
import { logger } from '@/utils/logger';
import { ValidationErrorDetail } from '../../../../shared/types/errors';

/**
 * Middleware that validates request data against provided validation chains
 * and returns standardized validation errors if validation fails
 * 
 * @param validations - Array of express-validator validation chains
 * @returns Middleware function
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Get validation errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }
    
    // Format errors to match our standard error format
    const formattedErrors: ValidationErrorDetail[] = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      code: `INVALID_${error.param.toUpperCase()}`
    }));
    
    logger.info('Validation failed', { 
      path: req.path, 
      method: req.method,
      errors: formattedErrors 
    });
    
    // Create a ValidationError with the formatted errors
    const validationError = ValidationError.fromFieldErrors(formattedErrors);
    
    next(validationError);
  };
}

/**
 * Creates validation schemas for common entity types
 * to promote consistency and reduce duplication
 */
export const validationSchemas = {
  // Export common validation schemas here
};

/**
 * Sanitizes request data by removing any fields not in the allowedFields list
 * 
 * @param allowedFields - Array of field names that are allowed in the request
 * @returns Middleware function
 */
export function sanitizeRequest(allowedFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      const sanitizedBody: Record<string, any> = {};
      
      // Only copy allowed fields to the sanitized body
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          sanitizedBody[field] = req.body[field];
        }
      }
      
      // Replace the original body with the sanitized one
      req.body = sanitizedBody;
    }
    
    next();
  };
}
