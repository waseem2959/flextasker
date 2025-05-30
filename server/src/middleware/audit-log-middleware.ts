/**
 * Audit Log Middleware
 * 
 * This middleware creates audit logs for important system actions,
 * providing a record of who did what and when for security and compliance purposes.
 */

import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { NextFunction, Request, Response } from 'express';

/**
 * Create an audit log middleware for a specific action and resource
 * 
 * @param action The action being performed (e.g., 'create', 'update', 'delete')
 * @param resource The resource being affected (e.g., 'user', 'task', 'bid')
 * @returns Middleware function that logs the action
 */
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
              timestamp: new Date(),
            },
          });
          
          if (process.env.NODE_ENV !== 'production') {
            logger.debug(`Audit log created: ${action} ${resource}`, {
              userId,
              action,
              resource,
              resourceId
            });
          }
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

/**
 * Predefined audit log middleware for common user actions
 */
export const userAuditLogs = {
  create: auditLog('create', 'user'),
  update: auditLog('update', 'user'),
  delete: auditLog('delete', 'user'),
  login: auditLog('login', 'user'),
  logout: auditLog('logout', 'user'),
  passwordReset: auditLog('password_reset', 'user'),
};

/**
 * Predefined audit log middleware for common task actions
 */
export const taskAuditLogs = {
  create: auditLog('create', 'task'),
  update: auditLog('update', 'task'),
  delete: auditLog('delete', 'task'),
  assign: auditLog('assign', 'task'),
  complete: auditLog('complete', 'task'),
  cancel: auditLog('cancel', 'task'),
};

/**
 * Predefined audit log middleware for common bid actions
 */
export const bidAuditLogs = {
  create: auditLog('create', 'bid'),
  update: auditLog('update', 'bid'),
  delete: auditLog('delete', 'bid'),
  accept: auditLog('accept', 'bid'),
  reject: auditLog('reject', 'bid'),
};

/**
 * Predefined audit log middleware for common payment actions
 */
export const paymentAuditLogs = {
  create: auditLog('create', 'payment'),
  process: auditLog('process', 'payment'),
  refund: auditLog('refund', 'payment'),
  dispute: auditLog('dispute', 'payment'),
};
