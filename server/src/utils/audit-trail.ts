/**
 * Audit Trail System
 * 
 * This module provides utilities for tracking and recording data changes
 * for auditing, compliance, and historical purposes.
 */

import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { logger } from './logger';
import { getRequestContext } from '../middleware/request-context';
import { withTransaction } from './db-transaction';
import { AuditEventType, AuditLogEntry, AnyAuditLogEntry, CreateAuditLogEntry, AccessAuditLogEntry } from './audit-trail-types';

// Initialize Prisma client
const prisma = new PrismaClient();

// Re-export audit event types from audit-trail-types.ts
export { AuditEventType } from './audit-trail-types';

/**
 * Records an audit event
 * 
 * @param entry The audit log entry to record
 * @param tx Optional transaction client for atomic operations
 * @returns The created audit log record
 */
export async function recordAuditEvent(
  entry: AnyAuditLogEntry,
  tx: any = prisma
): Promise<any> {
  try {
    const record = await tx.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        userId: entry.userId,
        requestId: entry.requestId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        timestamp: new Date()
      }
    });
    
    logger.debug('Audit event recorded', {
      auditId: record.id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action
    });
    
    return record;
  } catch (error) {
    logger.error('Failed to record audit event', { error, entry });
    // Do not throw error to prevent affecting the main operation
    return null;
  }
}

/**
 * Creates an audit log entry from request context
 * 
 * @param req The Express request object
 * @param entityType The type of entity being audited
 * @param entityId The ID of the entity being audited
 * @param action The audit event type
 * @param oldValues The previous values (for updates)
 * @param newValues The new values (for creates/updates)
 * @param metadata Additional contextual information
 * @returns The created audit log entry
 */
export async function auditFromRequest(
  req: Request,
  entityType: string,
  entityId: string,
  action: AuditEventType,
  oldValues?: Record<string, any> | null,
  newValues?: Record<string, any> | null,
  metadata?: Record<string, any> | null
): Promise<any> {
  const context = getRequestContext();
  
  const entry: AuditLogEntry = {
    entityType,
    entityId,
    action,
    userId: req.user?.id || null,
    requestId: context?.requestId || null,
    ipAddress: req.ip || null,
    userAgent: req.headers['user-agent'] || null,
    oldValues: oldValues || null,
    newValues: newValues || null,
    metadata: metadata || null
  };
  
  return await recordAuditEvent(entry);
}

/**
 * Audit middleware that automatically tracks entity changes
 * This should be used with Prisma middleware
 * 
 * @param params Prisma middleware parameters
 * @param action The audit event type
 */
export function createEntityChangeAudit(entityType: string) {
  return {
    async beforeCreate({ params, context }: any) {
      // Store context for afterCreate
      context.audit = {
        entityType,
        action: AuditEventType.CREATE,
        newValues: params.data
      };
      return params;
    },
    
    async afterCreate({ result, context }: any) {
      if (context.audit) {
        await recordAuditEvent({
          ...context.audit,
          entityId: result.id,
          userId: context.userId || null,
          requestId: context.requestId || null,
          ipAddress: context.ipAddress || null,
          userAgent: context.userAgent || null
        });
      }
      return result;
    },
    
    async beforeUpdate({ params, context }: any) {
      // Get the current state before update
      if (params.where.id) {
        const current = await prisma[entityType].findUnique({
          where: { id: params.where.id }
        });
        
        // Store context for afterUpdate
        context.audit = {
          entityType,
          entityId: params.where.id,
          action: AuditEventType.UPDATE,
          oldValues: current,
          newValues: params.data
        };
      }
      return params;
    },
    
    async afterUpdate({ params, context }: any) {
      if (context.audit) {
        await recordAuditEvent({
          ...context.audit,
          userId: context.userId || null,
          requestId: context.requestId || null,
          ipAddress: context.ipAddress || null,
          userAgent: context.userAgent || null
        });
      }
      return params;
    },
    
    async beforeDelete({ params, context }: any) {
      // Get the current state before deletion
      if (params.where.id) {
        const current = await prisma[entityType].findUnique({
          where: { id: params.where.id }
        });
        
        // Store context for afterDelete
        context.audit = {
          entityType,
          entityId: params.where.id,
          action: AuditEventType.DELETE,
          oldValues: current
        };
      }
      return params;
    },
    
    async afterDelete({ params, context }: any) {
      if (context.audit) {
        await recordAuditEvent({
          ...context.audit,
          userId: context.userId || null,
          requestId: context.requestId || null,
          ipAddress: context.ipAddress || null,
          userAgent: context.userAgent || null
        });
      }
      return params;
    }
  };
}

/**
 * Get audit history for an entity
 * 
 * @param entityType The type of entity
 * @param entityId The ID of the entity
 * @param options Query options (limit, offset, actions)
 * @returns Array of audit log entries
 */
export async function getEntityAuditHistory(
  entityType: string,
  entityId: string,
  options: {
    limit?: number;
    offset?: number;
    actions?: AuditEventType[];
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<any[]> {
  const {
    limit = 50,
    offset = 0,
    actions,
    startDate,
    endDate
  } = options;
  
  // Build the where clause
  const where: any = {
    entityType,
    entityId
  };
  
  if (actions && actions.length > 0) {
    where.action = { in: actions };
  }
  
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) {
      where.timestamp.gte = startDate;
    }
    if (endDate) {
      where.timestamp.lte = endDate;
    }
  }
  
  // Query the audit logs
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: {
      timestamp: 'desc'
    },
    skip: offset,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
  
  // Parse the JSON strings back to objects
  return logs.map(log => ({
    ...log,
    oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
    newValues: log.newValues ? JSON.parse(log.newValues) : null,
    metadata: log.metadata ? JSON.parse(log.metadata) : null
  }));
}

/**
 * Record a user authentication event (login/logout)
 * 
 * @param userId The ID of the user
 * @param action The authentication action (LOGIN/LOGOUT)
 * @param req The Express request object
 * @param metadata Additional metadata about the authentication
 * @returns The created audit log record
 */
export async function recordAuthEvent(
  userId: string,
  action: AuditEventType.LOGIN | AuditEventType.LOGOUT,
  req: Request,
  metadata?: Record<string, any>
): Promise<any> {
  return await auditFromRequest(
    req,
    'user',
    userId,
    action,
    null,
    null,
    {
      method: req.method,
      path: req.path,
      ...metadata
    }
  );
}

/**
 * Record a sensitive data access event
 * 
 * @param req The Express request object
 * @param entityType The type of entity being accessed
 * @param entityId The ID of the entity being accessed
 * @param accessType Description of the access type
 * @returns The created audit log record
 */
export async function recordDataAccessEvent(
  req: Request,
  entityType: string,
  entityId: string,
  accessType: string
): Promise<any> {
  return await auditFromRequest(
    req,
    entityType,
    entityId,
    AuditEventType.ACCESS,
    null,
    null,
    { accessType }
  );
}

/**
 * Record a data export event
 * 
 * @param req The Express request object
 * @param entityType The type of entity being exported
 * @param exportDetails Details about the export
 * @returns The created audit log record
 */
export async function recordDataExportEvent(
  req: Request,
  entityType: string,
  exportDetails: {
    format: string;
    filters?: Record<string, any>;
    recordCount?: number;
    includesSensitiveData?: boolean;
  }
): Promise<any> {
  return await auditFromRequest(
    req,
    entityType,
    'BULK',
    AuditEventType.EXPORT,
    null,
    null,
    exportDetails
  );
}

/**
 * Record an admin action
 * 
 * @param req The Express request object
 * @param action Description of the admin action
 * @param targetType The type of entity being affected
 * @param targetId The ID of the entity being affected
 * @param details Additional details about the action
 * @returns The created audit log record
 */
export async function recordAdminAction(
  req: Request,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, any>
): Promise<any> {
  return await auditFromRequest(
    req,
    targetType,
    targetId,
    AuditEventType.ADMIN_ACTION,
    null,
    null,
    {
      adminAction: action,
      ...details
    }
  );
}

/**
 * Record a permission change event
 * 
 * @param req The Express request object
 * @param userId The ID of the user whose permissions are changing
 * @param oldPermissions Previous permissions
 * @param newPermissions New permissions
 * @returns The created audit log record
 */
export async function recordPermissionChange(
  req: Request,
  userId: string,
  oldPermissions: Record<string, any>,
  newPermissions: Record<string, any>
): Promise<any> {
  return await auditFromRequest(
    req,
    'user',
    userId,
    AuditEventType.PERMISSION_CHANGE,
    oldPermissions,
    newPermissions,
    {
      changedBy: req.user?.id,
      reason: req.body?.reason
    }
  );
}

export default {
  recordAuditEvent,
  auditFromRequest,
  createEntityChangeAudit,
  getEntityAuditHistory,
  recordAuthEvent,
  recordDataAccessEvent,
  recordDataExportEvent,
  recordAdminAction,
  recordPermissionChange,
  AuditEventType
};
