/**
 * Application Enumerations
 * 
 * This file defines additional enumeration types used throughout the application
 * that are not part of the shared types. The core enums (UserRole, TaskStatus, etc.)
 * are imported from shared/types/enums.ts
 */

/**
 * Application environment
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Authentication status
 */
export enum AuthStatus {
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  LOADING = 'loading',
  ERROR = 'error',
}

/**
 * Task urgency levels
 */
export enum TaskUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Task complexity levels
 */
export enum TaskComplexity {
  SIMPLE = 'simple',
  STANDARD = 'standard',
  COMPLEX = 'complex',
  EXPERT = 'expert',
}

// TaskCategory moved to shared/types/common/enums.ts 
// Note: The shared version has different categories. Frontend-specific categories
// can be mapped to shared categories as needed

// PaymentStatus moved to shared/types/common/enums.ts to avoid duplication

/**
 * Payment methods
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  CASH = 'cash',
}

/**
 * Notification priority
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// VerificationStatus moved to shared/types/common/enums.ts to avoid duplication
// Note: Added UNVERIFIED status to shared enum for completeness

/**
 * User profile visibility
 */
export enum ProfileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  CONTACTS_ONLY = 'contacts_only',
}

// ReviewRating moved to shared/types/common/enums.ts to avoid duplication

/**
 * Supported languages
 */
export enum Language {
  ENGLISH = 'en',
  FRENCH = 'fr',
  SPANISH = 'es',
  ARABIC = 'ar',
  CHINESE = 'zh',
}

/**
 * Device types
 */
export enum DeviceType {
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  MOBILE = 'mobile',
}

/**
 * Browser types
 */
export enum BrowserType {
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  SAFARI = 'safari',
  EDGE = 'edge',
  IE = 'ie',
  OPERA = 'opera',
  OTHER = 'other',
}

/**
 * Event tracking categories
 */
export enum TrackingCategory {
  PAGE_VIEW = 'page_view',
  USER_ACTION = 'user_action',
  FORM_SUBMISSION = 'form_submission',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  ENGAGEMENT = 'engagement',
}

/**
 * Form field types
 */
export enum FormFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  PASSWORD = 'password',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE = 'file',
  HIDDEN = 'hidden',
}

/**
 * Connection state for websockets and real-time connections
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
}

// ErrorType and HttpStatusCode enums removed - now using shared types from shared/types/errors.ts
// This ensures consistency between frontend and backend error handling

/**
 * API request methods
 */
export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * Sort directions
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * UI Theme
 */
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/**
 * Date formats
 */
export enum DateFormat {
  SHORT = 'short', // MM/DD/YYYY
  MEDIUM = 'medium', // MMM DD, YYYY
  LONG = 'long', // MMMM DD, YYYY
  FULL = 'full', // DDDD, MMMM DD, YYYY
  ISO = 'iso', // YYYY-MM-DD
  TIME = 'time', // HH:MM
  DATETIME = 'datetime', // MM/DD/YYYY HH:MM
}

/**
 * Time formats
 */
export enum TimeFormat {
  HOURS_12 = '12', // 12-hour clock with AM/PM
  HOURS_24 = '24', // 24-hour clock
}

/**
 * Distance units
 */
export enum DistanceUnit {
  KILOMETERS = 'km',
  MILES = 'mi',
}

/**
 * Currency codes
 */
export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  AED = 'AED',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
}

/**
 * Feature flags
 */
export enum FeatureFlag {
  DARK_MODE = 'dark_mode',
  CHAT_SYSTEM = 'chat_system',
  PAYMENT_SYSTEM = 'payment_system',
  NOTIFICATIONS = 'notifications',
  TASK_SUGGESTIONS = 'task_suggestions',
  ADVANCED_SEARCH = 'advanced_search',
  ANALYTICS_DASHBOARD = 'analytics_dashboard',
  MULTI_CURRENCY = 'multi_currency',
}

/**
 * Toast/notification display types
 */
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Button types
 */
export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  DANGER = 'danger',
  GHOST = 'ghost',
  LINK = 'link',
  ICON = 'icon',
}

/**
 * Button sizes
 */
export enum ButtonSize {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
}

/**
 * Metrics types for performance monitoring
 */
export enum MetricType {
  TIMING = 'timing',
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  API_REQUEST = 'api_request',
  PAGE_LOAD = 'page_load',
  USER_INTERACTION = 'user_interaction',
  RESOURCE_LOAD = 'resource_load',
  CUSTOM = 'custom',
}
