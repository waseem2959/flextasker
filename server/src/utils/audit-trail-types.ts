/**
 * Audit Trail Types
 * 
 * This module defines types for the audit trail system to track changes
 * for compliance and accountability.
 */

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
export type CreateAuditLogEntry = Omit<AuditLogEntry, 'oldValues'> & {
  oldValues?: never;
};

/**
 * Helper type for access events where oldValues and newValues aren't needed
 */
export type AccessAuditLogEntry = Omit<AuditLogEntry, 'oldValues' | 'newValues'> & {
  oldValues?: never;
  newValues?: never;
};

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
