/**
 * Utils Module
 * 
 * This module exports all utility functions and classes from the standardized
 * utility files. It maintains backward compatibility while using the new
 * standardized naming convention.
 */

// Job and background processing utilities
export {
    // Queue infrastructure
    addJob, addRecurringJob, createQueue, getJob, getQueueMetrics, QueueName,
    registerProcessor, removeJob, shutdown
} from './job-queue';

export {
    // Job processors
    initializeJobProcessors
} from './job-processors';

// Crypto utilities
export {
    comparePassword, generateNumericCode, generateToken, hashPassword
} from './crypto';

// Database utilities
export { 
  prisma, executeDbOperation, findById, createRecord, updateRecord,
  deleteRecord, buildPaginationOptions, getCount, getPaginatedRecords 
} from './database-utils';

// Database transaction utilities
export {
  withTransaction, executeTransactionBatch, withRetry
} from './db-transaction';

// Database migration utilities
export {
  initializeMigrationSystem, applyPendingMigrations, 
  isMigrationsUpToDate, validateMigrationIntegrity
} from './db-migration';

// Error handling utilities
export {
    AppError, AuthenticationError, AuthorizationError, 
    ConflictError, NotFoundError, ValidationError,
    isOperationalError, createErrorResponse, getErrorMessage,
    errorHandlerMiddleware, ErrorType, HttpStatusCode, ValidationErrorDetail
} from './error-utils';

// Logging utilities
export { logger } from './logger';

// API documentation utilities
export * from './api-docs';

// API versioning utilities
export * from './api-versioning';

// Controller utilities
export * from './controller-utils';

// Response utilities
export {
    ApiSuccessResponse, ApiErrorResponse, ApiResponse, PaginationInfo, ErrorDetail,
    sendSuccess, sendError, sendValidationError, sendNotFoundError,
    sendUnauthorizedError, sendForbiddenError, sendConflictError,
    sendPaginatedSuccess, createPagination
} from './response-utils';

// Validation utilities
export { 
    validateWithZod, formatZodErrors, composeValidators, sanitizeObject, isValidEmail,
    validatePasswordStrength, ValidationSchemas,
    UserSchemas, TaskSchemas, BidSchemas, AuthSchemas, 
    PaymentSchemas, ReviewSchemas, NotificationSchemas,
    MessageSchemas, CategorySchemas, HealthCheckSchemas,
    initializeValidation
} from './validation-utils';

// Audit trail utilities
export {
    AuditLogEntry, AuditTrailFilter, AuditChangeSet,
    recordAuditEvent, auditFromRequest, createEntityChangeAudit,
    getEntityAuditHistory, recordAuthEvent, recordDataAccessEvent,
    recordDataExportEvent, recordAdminAction, recordPermissionChange,
    AuditEventType
} from './audit-utils';
