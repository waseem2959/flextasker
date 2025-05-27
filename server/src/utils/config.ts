/**
 * Configuration Management
 * 
 * This module centralizes access to environment variables and application settings.
 * It provides type-safe configuration with validation and default values.
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import { logger } from './logger';

// Load environment variables
dotenv.config();

/**
 * Configuration schema using Zod for validation
 */
const configSchema = z.object({
  // Server settings
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('localhost'),
  BASE_URL: z.string().url().default('http://localhost:3000'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  APP_VERSION: z.string().default('1.0.0'),
  
  // Database settings
  DATABASE_URL: z.string().min(1),
  
  // Redis settings
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  REDIS_PREFIX: z.string().default('flextasker:'),
  
  // JWT settings
  JWT_SECRET: z.string().min(16).default('super_secret_key_change_in_production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // File uploads
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(5 * 1024 * 1024), // 5MB
  
  // Email settings
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  
  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60 * 1000), // 1 minute
  
  // Performance
  CACHE_TTL: z.coerce.number().int().positive().default(60 * 60), // 1 hour
});

/**
 * Extract typed config from environment variables
 */
function loadConfig() {
  try {
    // Parse and validate config
    const config = configSchema.parse(process.env);
    
    // Log config in development (with sensitive values redacted)
    if (config.NODE_ENV === 'development') {
      const safeConfig = {
        ...config,
        JWT_SECRET: config.JWT_SECRET ? '[REDACTED]' : undefined,
        DATABASE_URL: config.DATABASE_URL ? '[REDACTED]' : undefined,
        SMTP_PASS: config.SMTP_PASS ? '[REDACTED]' : undefined,
      };
      
      logger.debug('Application configuration loaded', { config: safeConfig });
    }
    
    return config;
  } catch (error) {
    // Log validation errors and throw
    if (error instanceof z.ZodError) {
      logger.error('Configuration validation failed', { errors: error.errors });
      throw new Error(`Configuration validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    // Unknown error
    logger.error('Failed to load configuration', { error });
    throw error;
  }
}

/**
 * Typed configuration object
 */
export const config = loadConfig();

/**
 * Determine if the application is running in production
 */
export const isProduction = config.NODE_ENV === 'production';

/**
 * Determine if the application is running in test mode
 */
export const isTest = config.NODE_ENV === 'test';

/**
 * Determine if the application is running in development mode
 */
export const isDevelopment = config.NODE_ENV === 'development';

export default config;
