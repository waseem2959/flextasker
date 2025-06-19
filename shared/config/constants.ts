/**
 * Shared configuration constants between frontend and backend
 * This file eliminates configuration duplication across the project
 */

/**
 * API Configuration Constants
 */
export const API_CONFIG = {
  // Base API paths (without version prefix)
  BASE_PATH: '/api',
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: '/api/auth',
    USERS: '/api/users',
    TASKS: '/api/tasks',
    BIDS: '/api/bids',
    REVIEWS: '/api/reviews',
    NOTIFICATIONS: '/api/notifications',
    PAYMENTS: '/api/payments',
    UPLOADS: '/api/uploads',
    MONITORING: '/api/monitoring',
    WEBSOCKET: '/socket.io',
  },
  
  // Default ports
  DEFAULT_PORTS: {
    FRONTEND: 5173,
    BACKEND: 3000,
    REDIS: 6379,
    POSTGRES: 5432,
  },
  
  // Default URLs for development
  DEFAULT_URLS: {
    FRONTEND: 'http://localhost:5173',
    BACKEND: 'http://localhost:3000',
    API: 'http://localhost:3000/api',
    SOCKET: 'http://localhost:3000',
    UPLOADS: 'http://localhost:3000/uploads',
  },
} as const;

/**
 * Application Constants
 */
export const APP_CONFIG = {
  NAME: 'FlexTasker',
  VERSION: '1.0.0',
  DESCRIPTION: 'Flexible Task Marketplace Platform',
  
  // Pagination defaults
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
  },
  
  // File upload limits
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    MAX_FILES: 10,
  },
  
  // Rate limiting
  RATE_LIMIT: {
    DEFAULT_MAX: 100,
    DEFAULT_WINDOW_MS: 60000, // 1 minute
    AUTH_MAX: 5,
    AUTH_WINDOW_MS: 300000, // 5 minutes
  },
  
  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 300,    // 5 minutes
    MEDIUM: 3600,  // 1 hour
    LONG: 86400,   // 24 hours
  },
} as const;

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  ANALYTICS: 'ENABLE_ANALYTICS',
  OFFLINE: 'ENABLE_OFFLINE',
  NOTIFICATIONS: 'ENABLE_NOTIFICATIONS',
  PWA: 'ENABLE_PWA',
  DEVTOOLS: 'ENABLE_DEVTOOLS',
  MOCK_API: 'ENABLE_MOCK_API',
  WEBSOCKETS: 'ENABLE_WEBSOCKETS',
  REDIS_CACHE: 'ENABLE_REDIS_CACHE',
  EMAIL_VERIFICATION: 'ENABLE_EMAIL_VERIFICATION',
  SMS_VERIFICATION: 'ENABLE_SMS_VERIFICATION',
} as const;

/**
 * Environment Variable Names
 */
export const ENV_VARS = {
  // Frontend
  FRONTEND: {
    API_URL: 'VITE_API_URL',
    SOCKET_URL: 'VITE_SOCKET_URL',
    UPLOAD_URL: 'VITE_UPLOAD_URL',
    AUTH_ENDPOINT: 'VITE_AUTH_ENDPOINT',
    APP_NAME: 'VITE_APP_NAME',
    APP_VERSION: 'VITE_APP_VERSION',
    BUILD_TIME: 'VITE_BUILD_TIME',
  },
  
  // Backend
  BACKEND: {
    NODE_ENV: 'NODE_ENV',
    PORT: 'PORT',
    HOST: 'HOST',
    BASE_URL: 'BASE_URL',
    CLIENT_URL: 'CLIENT_URL',
    DATABASE_URL: 'DATABASE_URL',
    REDIS_URL: 'REDIS_URL',
    JWT_SECRET: 'JWT_SECRET',
    JWT_EXPIRES_IN: 'JWT_EXPIRES_IN',
    SMTP_HOST: 'SMTP_HOST',
    SMTP_PORT: 'SMTP_PORT',
    SMTP_USER: 'SMTP_USER',
    SMTP_PASS: 'SMTP_PASS',
    LOG_LEVEL: 'LOG_LEVEL',
  },
  
  // Shared
  SHARED: {
    NODE_ENV: 'NODE_ENV',
    DEV: 'DEV',
    PROD: 'PROD',
    MODE: 'MODE',
  },
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * WebSocket Events
 */
export const WEBSOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // User events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_TYPING: 'user:typing',
  
  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_BID_RECEIVED: 'task:bid_received',
  
  // Bid events
  BID_CREATED: 'bid:created',
  BID_UPDATED: 'bid:updated',
  BID_ACCEPTED: 'bid:accepted',
  BID_REJECTED: 'bid:rejected',
  
  // Notification events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DELETED: 'notification:deleted',
  
  // Chat events
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_TYPING: 'message:typing',
  
  // System events
  SYSTEM_MAINTENANCE: 'system:maintenance',
  SYSTEM_UPDATE: 'system:update',
} as const;

/**
 * Database Constants
 */
export const DATABASE_CONFIG = {
  // Connection pool settings
  POOL: {
    MIN: 2,
    MAX: 10,
    IDLE_TIMEOUT: 30000,
    ACQUIRE_TIMEOUT: 60000,
  },
  
  // Query timeouts
  TIMEOUTS: {
    QUERY: 30000,
    TRANSACTION: 60000,
  },
  
  // Prisma error codes
  ERROR_CODES: {
    UNIQUE_CONSTRAINT: 'P2002',
    NOT_FOUND: 'P2025',
    FOREIGN_KEY_CONSTRAINT: 'P2003',
    REQUIRED_FIELD_MISSING: 'P2012',
  },
} as const;

/**
 * Validation Constants
 */
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false,
  },
  
  EMAIL: {
    MAX_LENGTH: 254,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
    REGEX: /^\+?[\d\s\-\(\)]+$/,
  },
  
  TEXT: {
    SHORT_MAX: 255,
    MEDIUM_MAX: 1000,
    LONG_MAX: 5000,
  },
} as const;

/**
 * Re-export task configuration
 */
export { TASK_CONFIG } from './task-config';
