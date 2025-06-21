/**
 * Logger Service
 * 
 * This service provides consistent logging functionality throughout the client application
 * with different log levels and structured logging capabilities.
 * 
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Environment-based filtering (minimal logs in production)
 * - Support for structured logging with metadata
 * - Integration with monitoring systems in production
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Configurable minimum log level based on environment
const DEFAULT_LOG_LEVEL = (() => {
  // Check for Node/Jest environment first
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return LogLevel.WARN;
  }
  // Check for test environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return LogLevel.DEBUG;
  }
  // Default to debug for development
  return LogLevel.DEBUG;
})();

interface LoggerOptions {
  minLevel?: LogLevel;
  includeTimestamp?: boolean;
  redactSensitiveData?: boolean;
}

/**
 * Logger service for consistent client-side logging
 */
class LoggerService {
  private minLevel: LogLevel;
  private includeTimestamp: boolean;
  private redactSensitiveData: boolean;

  constructor(options: LoggerOptions = {}) {
    this.minLevel = options.minLevel ?? DEFAULT_LOG_LEVEL;
    this.includeTimestamp = options.includeTimestamp ?? true;
    this.redactSensitiveData = options.redactSensitiveData ?? true;
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log an informational message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log an error message
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Configure the logger
   */
  configure(options: LoggerOptions): void {
    if (options.minLevel !== undefined) {
      this.minLevel = options.minLevel;
    }
    if (options.includeTimestamp !== undefined) {
      this.includeTimestamp = options.includeTimestamp;
    }
    if (options.redactSensitiveData !== undefined) {
      this.redactSensitiveData = options.redactSensitiveData;
    }
  }

  /**
   * Internal logging implementation
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    // Check if this log level should be shown
    if (level < this.minLevel) {
      return;
    }

    const logData = {
      level: LogLevel[level],
      message,
      ...(this.includeTimestamp ? { timestamp: new Date().toISOString() } : {}),
      ...(metadata ? { metadata: this.processSensitiveData(metadata) } : {})
    };

    // Use appropriate console method based on log level
    switch (level) {
      case LogLevel.ERROR:
        console.error(message, logData);
        break;
      case LogLevel.WARN:
        console.warn(message, logData);
        break;
      case LogLevel.INFO:
        console.info(message, logData);
        break;
      case LogLevel.DEBUG:
      default:
        console.debug(message, logData);
        break;
    }

    // In production, we could send logs to a monitoring service
    this.sendToMonitoringService(level, message, metadata);
  }

  /**
   * Process metadata to redact any sensitive information
   */
  private processSensitiveData(metadata: Record<string, unknown>): Record<string, unknown> {
    if (!this.redactSensitiveData) {
      return metadata;
    }

    const processed = { ...metadata };
    
    // List of keys that might contain sensitive information
    const sensitiveKeys = ['password', 'token', 'secret', 'auth', 'key', 'credential', 'ssn', 'email'];
    
    // Redact any keys that match sensitive patterns
    Object.keys(processed).forEach(key => {
      if (sensitiveKeys.some(pattern => key.toLowerCase().includes(pattern))) {
        processed[key] = '[REDACTED]';
      } else if (typeof processed[key] === 'object' && processed[key] !== null) {
        // Recursively process nested objects
        processed[key] = this.processSensitiveData(processed[key] as Record<string, unknown>);
      }
    });

    return processed;
  }

  /**
   * Send logs to monitoring service in production
   */  private sendToMonitoringService(
    level: LogLevel, 
    _message: string, 
    _metadata?: Record<string, unknown>
  ): void {
    // Only send in production and for higher severity levels
    const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
    if (!isProd || level < LogLevel.WARN) {
      return;
    }

    // This would integrate with a monitoring service like Sentry, LogRocket, etc.
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureMessage(message, level === LogLevel.ERROR ? 'error' : 'warning');
    // }
  }
}

// Export a singleton instance for use throughout the application
export const logger = new LoggerService();
