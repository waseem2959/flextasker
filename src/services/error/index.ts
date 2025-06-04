/**
 * Error Service Index
 * 
 * This file centralizes exports for error-related services.
 */

import errorService, {
    AppError,
    AuthError,
    classifyError,
    createError,
    createErrorHandler,
    createErrorResponse,
    ErrorType,
    getErrorTitle,
    handleApiError,
    handleError,
    isAppError,
    NetworkError,
    NotFoundError,
    PermissionError,
    ServerError,
    TimeoutError,
    ValidationError
} from './error-service';

// Named exports
export {
    AppError, AuthError, classifyError,
    createError, createErrorHandler, createErrorResponse, ErrorType, getErrorTitle, handleApiError, handleError, isAppError, NetworkError, NotFoundError, PermissionError, ServerError, TimeoutError, ValidationError
};

// Default export for convenience
export default errorService;