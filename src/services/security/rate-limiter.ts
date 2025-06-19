/**
 * Client-Side Rate Limiting Service
 * 
 * Provides client-side rate limiting to prevent abuse and improve security.
 * Works in conjunction with server-side rate limiting for defense in depth.
 */

import { securityMonitor, SecurityEventType } from './security-monitor';

interface RateLimitRule {
  name: string;
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessful?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  message?: string; // Custom message when limit exceeded
}

interface RateLimitEntry {
  requests: number[];
  blocked: boolean;
  blockedUntil?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class RateLimiterService {
  private limits = new Map<string, RateLimitEntry>();
  private rules = new Map<string, RateLimitRule>();
  private globalBlocklist = new Set<string>();
  private isEnabled = true;

  constructor() {
    this.initializeDefaultRules();
    this.startCleanupTimer();
  }

  /**
   * Initialize default rate limiting rules
   */
  private initializeDefaultRules(): void {
    // API request limits
    this.addRule({
      name: 'api_requests',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      message: 'Too many API requests. Please try again later.'
    });

    // Login attempt limits
    this.addRule({
      name: 'login_attempts',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      skipSuccessful: true,
      message: 'Too many login attempts. Please try again later.'
    });

    // Form submission limits
    this.addRule({
      name: 'form_submissions',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      message: 'Too many form submissions. Please slow down.'
    });

    // Search query limits
    this.addRule({
      name: 'search_queries',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      message: 'Too many search requests. Please wait before searching again.'
    });

    // File upload limits
    this.addRule({
      name: 'file_uploads',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
      message: 'Too many file uploads. Please wait before uploading again.'
    });

    // Password reset limits
    this.addRule({
      name: 'password_reset',
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      message: 'Too many password reset attempts. Please try again later.'
    });
  }

  /**
   * Add a new rate limiting rule
   */
  public addRule(rule: RateLimitRule): void {
    this.rules.set(rule.name, rule);
  }

  /**
   * Check if request is allowed under rate limiting rules
   */
  public isAllowed(ruleName: string, identifier?: string): RateLimitResult {
    if (!this.isEnabled) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now()
      };
    }

    const rule = this.rules.get(ruleName);
    if (!rule) {
      throw new Error(`Rate limit rule '${ruleName}' not found`);
    }

    const key = this.generateKey(ruleName, identifier);
    
    // Check global blocklist
    if (this.globalBlocklist.has(key)) {
      securityMonitor.reportSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'medium',
        details: {
          ruleName,
          identifier,
          message: 'Request from globally blocked identifier'
        }
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + rule.windowMs,
        retryAfter: rule.windowMs
      };
    }

    let entry = this.limits.get(key);
    if (!entry) {
      entry = {
        requests: [],
        blocked: false
      };
      this.limits.set(key, entry);
    }

    const now = Date.now();
    const windowStart = now - rule.windowMs;

    // Remove old requests outside the window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

    // Check if currently blocked
    if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        retryAfter: entry.blockedUntil - now
      };
    }

    // Clear block if time has passed
    if (entry.blocked && entry.blockedUntil && now >= entry.blockedUntil) {
      entry.blocked = false;
      delete entry.blockedUntil;
    }

    // Check if limit would be exceeded
    if (entry.requests.length >= rule.maxRequests) {
      // Block the identifier
      entry.blocked = true;
      entry.blockedUntil = now + rule.windowMs;

      // Report security event
      securityMonitor.reportSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: this.getSeverityForRule(ruleName),
        details: {
          ruleName,
          identifier,
          requestCount: entry.requests.length,
          maxRequests: rule.maxRequests,
          windowMs: rule.windowMs,
          message: rule.message || 'Rate limit exceeded'
        }
      });

      // Add to global blocklist for repeat offenders
      this.checkForRepeatOffender(key, rule);

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        retryAfter: rule.windowMs
      };
    }

    // Allow request and record it
    entry.requests.push(now);
    
    return {
      allowed: true,
      remaining: rule.maxRequests - entry.requests.length,
      resetTime: Math.max(...entry.requests) + rule.windowMs
    };
  }

  /**
   * Record a request for rate limiting
   */
  public recordRequest(ruleName: string, identifier?: string, success?: boolean): RateLimitResult {
    const rule = this.rules.get(ruleName);
    if (!rule) {
      throw new Error(`Rate limit rule '${ruleName}' not found`);
    }

    // Skip recording based on rule configuration
    if (success && rule.skipSuccessful) {
      return {
        allowed: true,
        remaining: rule.maxRequests,
        resetTime: Date.now() + rule.windowMs
      };
    }

    if (!success && rule.skipFailedRequests) {
      return {
        allowed: true,
        remaining: rule.maxRequests,
        resetTime: Date.now() + rule.windowMs
      };
    }

    return this.isAllowed(ruleName, identifier);
  }

  /**
   * Check if identifier should be globally blocked
   */
  private checkForRepeatOffender(key: string, rule: RateLimitRule): void {
    const offenseKey = `${key}_offenses`;
    const offenseWindow = 60 * 60 * 1000; // 1 hour
    
    let offenseEntry = this.limits.get(offenseKey);
    if (!offenseEntry) {
      offenseEntry = {
        requests: [],
        blocked: false
      };
      this.limits.set(offenseKey, offenseEntry);
    }

    const now = Date.now();
    const windowStart = now - offenseWindow;

    // Remove old offenses
    offenseEntry.requests = offenseEntry.requests.filter(timestamp => timestamp > windowStart);
    
    // Add current offense
    offenseEntry.requests.push(now);

    // Block globally if too many offenses
    if (offenseEntry.requests.length >= 3) {
      this.globalBlocklist.add(key);
      
      securityMonitor.reportSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'high',
        details: {
          key,
          offenseCount: offenseEntry.requests.length,
          message: 'Identifier globally blocked for repeat rate limit violations'
        }
      });

      // Auto-unblock after 24 hours
      setTimeout(() => {
        this.globalBlocklist.delete(key);
      }, 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get severity level for different rule types
   */
  private getSeverityForRule(ruleName: string): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityRules = ['login_attempts', 'password_reset'];
    const mediumSeverityRules = ['api_requests', 'file_uploads'];
    
    if (highSeverityRules.includes(ruleName)) {
      return 'high';
    } else if (mediumSeverityRules.includes(ruleName)) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Generate key for rate limiting
   */
  private generateKey(ruleName: string, identifier?: string): string {
    if (identifier) {
      return `${ruleName}:${identifier}`;
    }

    // Use IP-like identifier based on browser fingerprint
    const fingerprint = this.generateBrowserFingerprint();
    return `${ruleName}:${fingerprint}`;
  }

  /**
   * Generate browser fingerprint for identification
   */
  private generateBrowserFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Browser fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.localStorage,
      !!window.sessionStorage,
      canvas.toDataURL()
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Start cleanup timer for old entries
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  /**
   * Clean up old rate limit entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    this.limits.forEach((entry, key) => {
      const rule = this.rules.get(key.split(':')[0]);
      if (!rule) return;

      const windowStart = now - rule.windowMs;
      entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

      // Remove entries with no recent requests and not blocked
      if (entry.requests.length === 0 && !entry.blocked) {
        entriesToDelete.push(key);
      }

      // Remove expired blocks
      if (entry.blocked && entry.blockedUntil && now >= entry.blockedUntil) {
        entry.blocked = false;
        delete entry.blockedUntil;
      }
    });

    entriesToDelete.forEach(key => {
      this.limits.delete(key);
    });
  }

  /**
   * Get current rate limit status for a rule
   */
  public getStatus(ruleName: string, identifier?: string): RateLimitResult {
    const rule = this.rules.get(ruleName);
    if (!rule) {
      throw new Error(`Rate limit rule '${ruleName}' not found`);
    }

    const key = this.generateKey(ruleName, identifier);
    const entry = this.limits.get(key);

    if (!entry) {
      return {
        allowed: true,
        remaining: rule.maxRequests,
        resetTime: Date.now() + rule.windowMs
      };
    }

    const now = Date.now();
    const windowStart = now - rule.windowMs;
    const validRequests = entry.requests.filter(timestamp => timestamp > windowStart);

    return {
      allowed: validRequests.length < rule.maxRequests && !entry.blocked,
      remaining: Math.max(0, rule.maxRequests - validRequests.length),
      resetTime: entry.blockedUntil || (Math.max(...validRequests, now) + rule.windowMs)
    };
  }

  /**
   * Manually block an identifier
   */
  public blockIdentifier(identifier: string, durationMs?: number): void {
    this.globalBlocklist.add(identifier);
    
    if (durationMs) {
      setTimeout(() => {
        this.globalBlocklist.delete(identifier);
      }, durationMs);
    }

    securityMonitor.reportSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: 'high',
      details: {
        identifier,
        durationMs,
        message: 'Identifier manually blocked'
      }
    });
  }

  /**
   * Unblock an identifier
   */
  public unblockIdentifier(identifier: string): void {
    this.globalBlocklist.delete(identifier);
    
    // Clear all rate limit entries for this identifier
    const keysToDelete: string[] = [];
    this.limits.forEach((_, key) => {
      if (key.includes(identifier)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.limits.delete(key);
    });
  }

  /**
   * Get all active rules
   */
  public getRules(): RateLimitRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Remove a rule
   */
  public removeRule(ruleName: string): void {
    this.rules.delete(ruleName);
    
    // Clean up entries for this rule
    const keysToDelete: string[] = [];
    this.limits.forEach((_, key) => {
      if (key.startsWith(`${ruleName}:`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.limits.delete(key);
    });
  }

  /**
   * Enable/disable rate limiting
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Clear all rate limit data
   */
  public clear(): void {
    this.limits.clear();
    this.globalBlocklist.clear();
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalRules: number;
    activeEntries: number;
    blockedIdentifiers: number;
    globallyBlocked: number;
  } {
    let blockedCount = 0;
    this.limits.forEach(entry => {
      if (entry.blocked) blockedCount++;
    });

    return {
      totalRules: this.rules.size,
      activeEntries: this.limits.size,
      blockedIdentifiers: blockedCount,
      globallyBlocked: this.globalBlocklist.size
    };
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiterService();

// React hook for rate limiting
export function useRateLimiter() {
  return {
    isAllowed: (ruleName: string, identifier?: string) => {
      return rateLimiter.isAllowed(ruleName, identifier);
    },
    
    recordRequest: (ruleName: string, identifier?: string, success?: boolean) => {
      return rateLimiter.recordRequest(ruleName, identifier, success);
    },
    
    getStatus: (ruleName: string, identifier?: string) => {
      return rateLimiter.getStatus(ruleName, identifier);
    },
    
    addRule: (rule: RateLimitRule) => {
      rateLimiter.addRule(rule);
    }
  };
}

export type { RateLimitRule, RateLimitResult };
export default rateLimiter;