import { db } from '@/utils/database';
import { logger } from '@/utils/logger';
import { NextFunction, Request, Response } from 'express';

export const auditLog = (action: string, resource: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Continue with the request first
      next();
      
      // After the request is processed, log the action
      // We use setImmediate to avoid blocking the response
      setImmediate(async () => {
        try {
          const userId = req.user?.id;
          const resourceId = req.params.id ?? req.body.id;
          
          await db.auditLog.create({
            data: {
              userId,
              action,
              resource,
              resourceId,
              details: {
                method: req.method,
                url: req.url,
                body: req.body,
                params: req.params,
                query: req.query,
              },
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
            },
          });
        } catch (error) {
          // Don't fail the request if audit logging fails
          logger.error('Failed to create audit log:', error);
        }
      });
    } catch (error) {
      next(error);
    }
  };
};