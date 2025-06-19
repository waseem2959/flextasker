/**
 * Zod Validation Middleware
 * Uses the centralized validation schemas for request validation
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { HTTP_STATUS } from '../../../shared/config/constants';
import { formatValidationErrors } from '../../../src/lib/validation-utils';

/**
 * Validation target types
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation schema configuration
 */
interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Create validation middleware using Zod schemas
 */
export const validateRequest = (config: ValidationConfig) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors: Record<string, string[]> = {};

      // Validate body
      if (config.body) {
        const result = config.body.safeParse(req.body);
        if (!result.success) {
          errors.body = result.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          );
        } else {
          req.body = result.data;
        }
      }

      // Validate query parameters
      if (config.query) {
        const result = config.query.safeParse(req.query);
        if (!result.success) {
          errors.query = result.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          );
        } else {
          req.query = result.data;
        }
      }

      // Validate route parameters
      if (config.params) {
        const result = config.params.safeParse(req.params);
        if (!result.success) {
          errors.params = result.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          );
        } else {
          req.params = result.data;
        }
      }

      // If there are validation errors, return them
      if (Object.keys(errors).length > 0) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal validation error',
      });
      return;
    }
  };
};

/**
 * Shorthand validation functions for common patterns
 */
export const validateBody = (schema: ZodSchema) => validateRequest({ body: schema });
export const validateQuery = (schema: ZodSchema) => validateRequest({ query: schema });
export const validateParams = (schema: ZodSchema) => validateRequest({ params: schema });

/**
 * Common parameter schemas
 */
export const commonSchemas = {
  uuidParam: z.object({
    id: z.string().uuid('Invalid UUID format'),
  }),
  
  paginationQuery: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  }).refine(data => data.page > 0, {
    message: 'Page must be greater than 0',
    path: ['page']
  }).refine(data => data.limit > 0 && data.limit <= 100, {
    message: 'Limit must be between 1 and 100',
    path: ['limit']
  }),

  statusUpdateBody: z.object({
    status: z.string().min(1, 'Status is required'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  }),
};

/**
 * Express-validator to Zod migration helpers
 */
export const createExpressValidatorCompatible = (zodSchema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = zodSchema.safeParse(req.body);
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        msg: err.message,
        param: err.path.join('.'),
        location: 'body',
        value: err.path.reduce((obj, key) => obj?.[key], req.body),
      }));

      // Store errors in the same format as express-validator
      (req as any).validationErrors = () => errors;
      return next();
    }

    req.body = result.data;
    (req as any).validationErrors = () => [];
    next();
  };
};

