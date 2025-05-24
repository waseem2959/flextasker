import 'express';

declare global {
  namespace Express {
    interface Request {
      // Added by authentication middleware
      user?: {
        id: string;
        email: string;
        role: 'USER' | 'TASKER' | 'ADMIN';
        isActive: boolean;
      };
      
      // Added by file upload middleware (if using custom file handling)
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[];
      
      // Added by request ID middleware (for tracing)
      requestId?: string;
      
      // Added by rate limiting middleware
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };
    }
    
    interface Response {
      // Custom response methods you might add
      sendSuccess?: (data: unknown, message?: string) => Response;
      sendError?: (message: string, statusCode?: number) => Response;
    }
  }
}