/**
 * FlexTasker Type System with TypeScript Improvements
 * 
 * This file serves as the central export point for all type definitions,
 * providing a clean and organized type system throughout the application.
 * 
 * Using kebab-case naming convention for all type files with descriptive suffixes (-types.ts).
 * This ensures consistency and makes the purpose of each file immediately clear.
 */

// Import core shared enums as the canonical source
// These are shared between frontend and backend and should be the source of truth
import {
    BidStatus,
    BudgetType,
    NotificationType,
    TaskPriority,
    TaskStatus,
    UserRole
} from '../../shared/types/common/enums';

// Import additional app-specific enums that don't conflict with shared enums
import {
    AuthStatus,
    BrowserType,
    ConnectionState,
    CurrencyCode,
    DateFormat,
    DeviceType,
    DistanceUnit,
    Environment,
    FeatureFlag,
    FormFieldType,
    HttpStatusCode,
    Language,
    MetricType,
    PaymentMethod,
    PaymentStatus,
    ProfileVisibility,
    RequestMethod,
    ReviewRating,
    SortDirection,
    TaskCategory,
    TaskComplexity,
    TaskUrgency,
    Theme,
    TimeFormat,
    ToastType,
    TrackingCategory,
    VerificationStatus
} from './app-enums';

// Re-export shared enums as the canonical source
export {
    BidStatus,
    BudgetType,
    NotificationType,
    TaskPriority,
    TaskStatus,
    UserRole
};

// Re-export additional app-specific enums
    export {
        AuthStatus,
        BrowserType,
        ConnectionState,
        CurrencyCode,
        DateFormat,
        DeviceType,
        DistanceUnit,
        Environment,

        FeatureFlag,
        FormFieldType,
        HttpStatusCode,
        Language,
        MetricType,
        PaymentMethod,
        PaymentStatus,
        ProfileVisibility,
        RequestMethod,
        ReviewRating,
        SortDirection,
        TaskCategory,
        TaskComplexity,
        TaskUrgency,
        Theme,
        TimeFormat,
        ToastType,
        TrackingCategory,
        VerificationStatus
    };

// Export button-specific types with selective exports for ButtonSize and ButtonVariant
// to avoid conflicts with app-enums


// Import errors without direct export
    import * as ErrorsModule from './errors';

// Export specific items from errors except the ErrorType enum to avoid conflict
export {
    AppError,
    AuthError,
    classifyError,
    createError,
    createErrorResponse,
    handleApiError,
    isAppError,
    NetworkError,
    NotFoundError,
    PermissionError,
    ServerError,
    TimeoutError,
    ValidationError
} from './errors';

// Export API client types
export * from './api-client-types';

// Export model types
export * from './models-types';

// Export task discriminated union types
export * from './task-types';

// Export API response types
export * from './api-types';

// Export messaging types
export * from './messaging-types';

// Import types with explicit names to avoid ambiguity errors
import * as ApiClientTypes from './api-client-types';
import * as ApiTypes from './api-types';
import * as AppEnums from './app-enums';

import * as MessagingTypes from './messaging-types';
import * as ModelTypes from './models-types';
import * as TaskTypes from './task-types';

// Re-export with namespaces to prevent naming conflicts
export {
    ApiClientTypes,
    ApiTypes,
    AppEnums,
    ErrorsModule,
    MessagingTypes,
    ModelTypes,
    TaskTypes
};

// Export UserImpl class directly for instantiation
  export { UserImpl } from './models-types';

// Export shared user types for consistency
export type {
    AdminUser, BaseUser, ClientUser, PasswordChangeRequest, TaskerUser, UserProfile, UserRegistrationRequest, UserSearchParams,
    UsersResponse, UserUpdateRequest, UserWithRole
} from '../../shared/types/common/user-types';

// Export primary types directly (these are the canonical definitions)
// Using 'export type' syntax for proper isolation with isolatedModules
export type {
    ApiUserResponse, AuthContextType,
    AuthTokens,
    Bid,
    LoginCredentials,
    RegisterData,
    Review,
    Task,
    User
} from './models-types';

// Export messaging types directly for convenience
export type {
    Conversation,
    Message,
    SendMessageRequest,
    TypingIndicator
} from './messaging-types';

// Type aliases for backward compatibility
export type UserRoleType = UserRole;
export type TaskStatusType = TaskStatus;
export type TaskPriorityType = TaskPriority;
export type BudgetTypeType = BudgetType;
export type BidStatusType = BidStatus;
// ErrorType now comes from shared/types/errors.ts for consistency

// Re-export commonly used API Response type
export type ApiResponse<T = any> = ApiTypes.ApiResponse<T>;
