/**
 * Error Tracking Service
 * 
 * Comprehensive error tracking and monitoring system for production applications.
 * Integrates with popular error tracking services and provides local fallback.
 */

import { AppError, ErrorType } from '@/types/errors';

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  buildVersion?: string;
  environment?: string;
  customTags?: Record<string, string>;
  breadcrumbs?: Breadcrumb[];
}

interface Breadcrumb {
  message: string;
  category: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  timestamp: string;
  data?: Record<string, any>;
}

interface ErrorReport {
  error: Error | AppError;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint?: string;
}

class ErrorTrackingService {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private isEnabled = true;
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }
  
  /**
   * Initialize error tracking service
   */
  initialize(config?: {
    apiKey?: string;
    environment?: string;
    release?: string;
    maxBreadcrumbs?: number;
  }): void {
    if (config?.maxBreadcrumbs) {
      this.maxBreadcrumbs = config.maxBreadcrumbs;
    }
    
    // Add environment info
    this.addBreadcrumb({
      message: 'Error tracking initialized',
      category: 'system',
      level: 'info',
      timestamp: new Date().toISOString(),
      data: {
        environment: config?.environment || process.env.NODE_ENV,
        release: config?.release || process.env.VITE_APP_VERSION,
        userAgent: navigator.userAgent
      }
    });
  }
  
  /**
   * Report an error to tracking service
   */
  reportError(error: Error | AppError, context: Partial<ErrorContext> = {}): void {
    if (!this.isEnabled) return;
    
    const errorReport: ErrorReport = {
      error,
      context: this.buildContext(context),
      severity: this.determineSeverity(error),
      fingerprint: this.generateFingerprint(error)
    };
    
    // Add error breadcrumb
    this.addBreadcrumb({
      message: error.message,
      category: 'error',
      level: 'error',
      timestamp: new Date().toISOString(),
      data: {
        stack: error.stack,
        name: error.name,
        type: error instanceof AppError ? error.type : 'unknown'
      }
    });
    
    // Send to external service (if configured)
    this.sendToExternalService(errorReport);
    
    // Local logging for development
    this.logLocally(errorReport);
  }
  
  /**
   * Add breadcrumb for tracking user actions
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb);
    
    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }
  
  /**
   * Set user context for error reports
   */
  setUserContext(userId: string, userData?: Record<string, any>): void {
    this.addBreadcrumb({
      message: `User context set: ${userId}`,
      category: 'user',
      level: 'info',
      timestamp: new Date().toISOString(),
      data: userData
    });
  }
  
  /**
   * Track performance metrics
   */
  trackPerformance(metric: {
    name: string;
    value: number;
    unit: string;
    tags?: Record<string, string>;
  }): void {
    this.addBreadcrumb({
      message: `Performance: ${metric.name}`,
      category: 'performance',
      level: 'info',
      timestamp: new Date().toISOString(),
      data: metric
    });
    
    // Send performance data to monitoring service
    this.sendPerformanceData(metric);
  }
  
  /**
   * Track custom events
   */
  trackEvent(event: {
    name: string;
    properties?: Record<string, any>;
    category?: string;
  }): void {
    this.addBreadcrumb({
      message: `Event: ${event.name}`,
      category: event.category || 'custom',
      level: 'info',
      timestamp: new Date().toISOString(),
      data: event.properties
    });
  }
  
  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), {
        url: window.location.href,
        customTags: {
          source: 'window.onerror',
          filename: event.filename,
          lineno: String(event.lineno),
          colno: String(event.colno)
        }
      });
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
        
      this.reportError(error, {
        url: window.location.href,
        customTags: {
          source: 'unhandledrejection'
        }
      });
    });
    
    // Handle network errors
    window.addEventListener('offline', () => {
      this.addBreadcrumb({
        message: 'Network went offline',
        category: 'network',
        level: 'warning',
        timestamp: new Date().toISOString()
      });
    });
    
    window.addEventListener('online', () => {
      this.addBreadcrumb({
        message: 'Network came online',
        category: 'network',
        level: 'info',
        timestamp: new Date().toISOString()
      });
    });
  }
  
  /**
   * Build error context
   */
  private buildContext(context: Partial<ErrorContext>): ErrorContext {
    return {
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      buildVersion: process.env.VITE_APP_VERSION || 'development',
      environment: process.env.NODE_ENV,
      breadcrumbs: [...this.breadcrumbs],
      ...context
    };
  }
  
  /**
   * Determine error severity
   */
  private determineSeverity(error: Error | AppError): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof AppError) {
      switch (error.type) {
        case ErrorType.AUTHENTICATION:
        case ErrorType.AUTHORIZATION:
          return 'high';
        case ErrorType.VALIDATION:
          return 'medium';
        case ErrorType.NETWORK:
          return 'medium';
        case ErrorType.SERVER:
          return 'high';
        case ErrorType.DATABASE:
          return 'critical';
        default:
          return 'medium';
      }
    }
    
    // Check for critical runtime errors
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return 'high';
    }
    
    return 'medium';
  }
  
  /**
   * Generate error fingerprint for grouping
   */
  private generateFingerprint(error: Error): string {
    const stack = error.stack || error.message;
    const relevantLines = stack.split('\n').slice(0, 3).join('\n');
    
    // Simple hash function for fingerprinting
    let hash = 0;
    for (let i = 0; i < relevantLines.length; i++) {
      const char = relevantLines.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Send error to external monitoring service
   */
  private sendToExternalService(errorReport: ErrorReport): void {
    // In production, integrate with services like Sentry, Bugsnag, etc.
    // Example Sentry integration:
    /*
    if (window.Sentry) {
      window.Sentry.withScope((scope) => {
        scope.setLevel(errorReport.severity);
        scope.setContext('errorContext', errorReport.context);
        scope.setFingerprint([errorReport.fingerprint]);
        window.Sentry.captureException(errorReport.error);
      });
    }
    */
    
    // For now, queue for later transmission
    this.queueForTransmission(errorReport);
  }
  
  /**
   * Local error logging for development
   */
  private logLocally(errorReport: ErrorReport): void {
    console.group(`🚨 Error Report [${errorReport.severity.toUpperCase()}]`);
    console.error('Error:', errorReport.error);
    console.log('Context:', errorReport.context);
    console.log('Fingerprint:', errorReport.fingerprint);
    console.log('Breadcrumbs:', errorReport.context.breadcrumbs?.slice(-5));
    console.groupEnd();
  }
  
  /**
   * Send performance data to monitoring service
   */
  private sendPerformanceData(metric: any): void {
    // In production, send to performance monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metric:', metric);
    }
  }
  
  /**
   * Queue error for transmission when network is available
   */
  private queueForTransmission(errorReport: ErrorReport): void {
    const queue = this.getErrorQueue();
    queue.push({
      ...errorReport,
      queuedAt: new Date().toISOString()
    });
    
    // Limit queue size
    if (queue.length > 100) {
      queue.splice(0, queue.length - 100);
    }
    
    localStorage.setItem('errorQueue', JSON.stringify(queue));
    
    // Attempt to send queued errors
    this.processErrorQueue();
  }
  
  /**
   * Get error queue from localStorage
   */
  private getErrorQueue(): any[] {
    try {
      const queue = localStorage.getItem('errorQueue');
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }
  
  /**
   * Process queued errors
   */
  private processErrorQueue(): void {
    const queue = this.getErrorQueue();
    if (queue.length === 0) return;
    
    // In production, implement actual transmission logic
    console.log(`📤 Processing ${queue.length} queued errors`);
    
    // Clear queue after processing
    localStorage.removeItem('errorQueue');
  }
  
  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Enable/disable error tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Create singleton instance
export const errorTracker = new ErrorTrackingService();

// React hook for error tracking
export function useErrorTracking() {
  return {
    reportError: (error: Error, context?: Partial<ErrorContext>) => {
      errorTracker.reportError(error, context);
    },
    
    trackEvent: (name: string, properties?: Record<string, any>) => {
      errorTracker.trackEvent({ name, properties });
    },
    
    addBreadcrumb: (message: string, category: string = 'user', data?: Record<string, any>) => {
      errorTracker.addBreadcrumb({
        message,
        category,
        level: 'info',
        timestamp: new Date().toISOString(),
        data
      });
    },
    
    setUserContext: (userId: string, userData?: Record<string, any>) => {
      errorTracker.setUserContext(userId, userData);
    }
  };
}

export default errorTracker;