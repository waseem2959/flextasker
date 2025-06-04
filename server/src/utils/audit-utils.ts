/**
 * Audit Utilities
 * 
 * This module provides utilities for tracking and recording data changes
 * for auditing, compliance, and historical purposes.
 */

import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { getRequestContext } from '../middleware/request-context-middleware';
import { logger } from './logger';

// Initialize Prisma client
const prisma = new PrismaClient();

// Interface for dynamic model access
interface DynamicPrismaModel {
  findUnique: (args: { where: { id: string } }) => Promise<Record<string, any>>;
}

/**
 * Enum for audit event types
 */
export enum AuditEventType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PERMISSION_CHANGE = 'permission_change',
  STATUS_CHANGE = 'status_change',
  EXPORT = 'export',
  IMPORT = 'import',
  ACCESS = 'access'
}

/**
 * Interface for audit log entry
 */
export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: AuditEventType;
  userId: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Helper type for create events where oldValues aren't needed
 */
export interface CreateAuditLogEntry extends AuditLogEntry {
  oldValues?: never;
}

/**
 * Helper type for access events where oldValues and newValues aren't needed
 */
export interface AccessAuditLogEntry extends AuditLogEntry {
  oldValues?: never;
  newValues?: never;
}

/**
 * Combined audit log entry type
 */
export type AnyAuditLogEntry = AuditLogEntry | CreateAuditLogEntry | AccessAuditLogEntry;

/**
 * Interface for audit trail filter
 */
export interface AuditTrailFilter {
  entityType?: string;
  entityId?: string;
  action?: AuditEventType | AuditEventType[];
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Interface for an audit change set showing differences
 */
export interface AuditChangeSet {
  field: string;
  oldValue: any;
  newValue: any;
}

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
    // Ensure timestamp is set
    entry.timestamp ??= new Date();

    // Log the audit event
    logger.info('Recording audit event', {
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      userId: entry.userId
    });

    // Store in database
    const auditRecord = await tx.auditLog.create({
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
        timestamp: entry.timestamp
      }
    });

    return auditRecord;
  } catch (error) {
    logger.error('Failed to record audit event', { error, entry });
    // Don't throw - audit failures shouldn't break main functionality
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
  // Get user ID from request context
  const context = getRequestContext(req);
  const userId = context?.userId ?? 'system';
  
  // Create audit entry
  const entry: AnyAuditLogEntry = {
    entityType,
    entityId,
    action,
    userId,
    requestId: req.headers['x-request-id'] as string,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] as string,
    oldValues: oldValues || undefined,
    newValues: newValues || undefined,
    metadata: metadata || undefined
  };
  
  return recordAuditEvent(entry);
}

/**
 * Audit middleware that automatically tracks entity changes
 */
export function createEntityChangeAudit(entityType: string) {
  return {
    /**
     * Middleware for create operations
     */
    async create({ params, result }: any) {
      try {
        await recordAuditEvent({
          entityType,
          entityId: result.id,
          action: AuditEventType.CREATE,
          userId: params.data.createdBy ?? 'system',
          newValues: result
        });
      } catch (error) {
        logger.error('Failed to audit create operation', { error, entityType });
      }
    },
    
    /**
     * Middleware for update operations
     */
    async update({ params, result }: any) {
      try {
        const id = params.where.id;
        if (!id) return;
        
        // Get the model and safely cast it to our interface
        const client = prisma[entityType as keyof typeof prisma];
        const model = (client as unknown) as DynamicPrismaModel;
        
        const oldRecord = await model.findUnique({
          where: { id }
        });
        
        if (!oldRecord) return;
        
        // Determine what fields changed
        const changedFields: Record<string, any> = {};
        Object.keys(params.data).forEach(key => {
          // Skip metadata fields
          if (['updatedAt', 'updatedBy'].includes(key)) return;
          
          // Check if the field actually changed
          if (JSON.stringify(oldRecord[key]) !== JSON.stringify(result[key])) {
            changedFields[key] = result[key];
          }
        });
        
        // Only record if something actually changed
        if (Object.keys(changedFields).length > 0) {
          await recordAuditEvent({
            entityType,
            entityId: id,
            action: AuditEventType.UPDATE,
            userId: params.data.updatedBy ?? 'system',
            oldValues: oldRecord,
            newValues: changedFields
          });
        }
      } catch (error) {
        logger.error('Failed to audit update operation', { error, entityType });
      }
    },
    
    /**
     * Middleware for delete operations
     */
    async delete({ params, result }: any) {
      try {
        const id = params.where.id;
        if (!id) return;
        
        await recordAuditEvent({
          entityType,
          entityId: id,
          action: AuditEventType.DELETE,
          userId: 'system', // Delete operations often don't track who did it
          oldValues: result
        });
      } catch (error) {
        logger.error('Failed to audit delete operation', { error, entityType });
      }
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
  
  // Build where clause
  const where: any = {
    entityType,
    entityId
  };
  
  // Filter by actions if specified
  if (actions && actions.length > 0) {
    where.action = {
      in: actions
    };
  }
  
  // Filter by date range if specified
  if (startDate || endDate) {
    where.timestamp = {};
    
    if (startDate) {
      where.timestamp.gte = startDate;
    }
    
    if (endDate) {
      where.timestamp.lte = endDate;
    }
  }
  
  // Query audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where,
    orderBy: {
      timestamp: 'desc'
    },
    skip: offset,
    take: limit
  });
  
  // Parse JSON fields
  return auditLogs.map((log: any) => ({
    ...log,
    oldValues: log.oldValues ? JSON.parse(log.oldValues as string) : null,
    newValues: log.newValues ? JSON.parse(log.newValues as string) : null,
    metadata: log.metadata ? JSON.parse(log.metadata as string) : null
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
  return auditFromRequest(
    req,
    'user',
    userId,
    action,
    null,
    null,
    {
      ...metadata,
      timestamp: new Date().toISOString()
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
  return auditFromRequest(
    req,
    entityType,
    entityId,
    AuditEventType.ACCESS,
    null,
    null,
    {
      accessType,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
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
  return auditFromRequest(
    req,
    entityType,
    'bulk',
    AuditEventType.EXPORT,
    null,
    null,
    {
      ...exportDetails,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
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
  return auditFromRequest(
    req,
    targetType,
    targetId,
    AuditEventType.UPDATE,
    null,
    null,
    {
      adminAction: action,
      ...details,
      timestamp: new Date().toISOString()
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
  return auditFromRequest(
    req,
    'user',
    userId,
    AuditEventType.PERMISSION_CHANGE,
    oldPermissions,
    newPermissions,
    {
      timestamp: new Date().toISOString()
    }
  );
}

// Default export for backward compatibility
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
