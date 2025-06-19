/**
 * Utils Module
 * 
 * This module exports all utility functions and classes from the standardized
 * utility files. It maintains backward compatibility while using the new
 * standardized naming convention.
 */

// Job and background processing utilities
export {
    QueueName,
    // Queue infrastructure
    addJob, addRecurringJob, createQueue, getJob, getQueueMetrics, registerProcessor, removeJob, shutdown
} from './job-queue';

export {
    // Job processors
    initializeJobProcessors
} from './job-processors';

// Crypto utilities
export {
    comparePassword, generateNumericCode, generateToken, hashPassword
} from './crypto';

// Database utilities - consolidated from database-utils.ts
export { buildPaginationOptions, createRecord, db, deleteRecord, executeDbOperation, findById, getCount, getPaginatedRecords, prisma, updateRecord } from './database';

// Database transaction utilities
export { executeTransactionBatch, withRetry, withTransaction } from './db-transaction';

// Database migration utilities
export { applyPendingMigrations, initializeMigrationSystem, isMigrationsUpToDate, validateMigrationIntegrity } from './db-migration';

// Error handling utilities
export {
    AppError, AuthenticationError, AuthorizationError,
    ConflictError, ErrorType, HttpStatusCode, NotFoundError, ValidationError, ValidationErrorDetail, createErrorResponse, errorHandlerMiddleware, getErrorMessage, isOperationalError
} from './error-utils';

// Logging utilities
export { logger } from './logger';

// API documentation utilities
export * from './api-docs';

// API versioning utilities
export * from './api-versioning';

// Controller utilities (consolidated into pagination.ts and base-controller.ts)

// Response utilities
export { ApiErrorResponse, ApiResponse, ApiSuccessResponse, ErrorDetail, PaginationInfo, createPagination, sendConflictError, sendError, sendForbiddenError, sendNotFoundError, sendPaginatedSuccess, sendSuccess, sendUnauthorizedError, sendValidationError } from './response-utils';

// Validation utilities
export { AuthSchemas, BidSchemas, CategorySchemas, HealthCheckSchemas, MessageSchemas, NotificationSchemas, PaymentSchemas, ReviewSchemas, TaskSchemas, UserSchemas, ValidationSchemas, composeValidators, formatZodErrors, initializeValidation, sanitizeObject, validatePasswordStrength, validateWithZod } from './validation-utils';

// Audit trail utilities
export {
    AuditChangeSet, AuditEventType, AuditLogEntry, AuditTrailFilter, auditFromRequest, createEntityChangeAudit,
    getEntityAuditHistory, recordAdminAction, recordAuditEvent, recordAuthEvent, recordDataAccessEvent,
    recordDataExportEvent, recordPermissionChange
} from './audit-utils';

