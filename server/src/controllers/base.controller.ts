/**
 * Base Controller
 * 
 * Abstract base controller that provides common functionality for all controllers.
 * This helps maintain consistent patterns across the application and reduces code duplication.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { sendSuccess, sendError } from '@/utils/response';

export abstract class BaseController {
  /**
   * Handle async route handlers with proper error catching
   * @param fn The async route handler function
   */
  protected asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Send a successful response with standardized format
   * @param res Express response object
   * @param data Data to send
   * @param message Success message
   * @param statusCode HTTP status code
   */
  protected sendSuccess(
    res: Response, 
    data: any = null, 
    message: string = 'Success', 
    statusCode: number = 200
  ) {
    return sendSuccess(res, data, message, statusCode);
  }

  /**
   * Send an error response with standardized format
   * @param res Express response object
   * @param error Error object or message
   * @param statusCode HTTP status code
   */
  protected sendError(
    res: Response, 
    error: any, 
    statusCode: number = 500
  ) {
    return sendError(res, error, statusCode);
  }

  /**
   * Log an event with structured data
   * @param level Log level
   * @param message Log message
   * @param data Additional data to log
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    logger[level](message, data);
  }
}
