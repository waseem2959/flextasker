import 'express';
import { VersionStatus } from '../utils/api-versioning';

declare global {
  namespace Express {
    interface Request {
      // Added by authentication middleware - using Prisma User type for consistency
      user?: User & {
        language?: string;
      };

      // Added by file upload middleware (if using custom file handling)
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[];

      // Added by request context middleware (for tracing and monitoring)
      context?: {
        requestId: string;
        startTime: number;
        ipAddress: string;
        userAgent: string;
        correlationId: string;
        transactionId: string;
        user?: Record<string, any>;
      };

      // Added by request ID middleware (for tracing) - legacy support
      requestId?: string;

      // Added by rate limiting middleware
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };

      // Added by API versioning middleware
      apiVersion?: {
        requested: string | null;
        effective: string;
        status: VersionStatus;
      };

      // Added by language middleware
      language?: string;
    }

    interface Response {
      // Custom response methods you might add
      sendSuccess?: (data: unknown, message?: string) => Response;
      sendError?: (message: string, statusCode?: number) => Response;
    }
  }
}