/**
 * Security Monitoring Service
 * 
 * Comprehensive security monitoring and threat detection system.
 * Monitors for suspicious activities, security violations, and potential attacks.
 */

import { errorTracker } from '../monitoring/error-tracking';

interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  details: Record<string, any>;
  fingerprint: string;
  userAgent?: string;
  url?: string;
  ip?: string;
  userId?: string;
}

enum SecurityEventType {
  CSRF_ATTACK = 'csrf_attack',
  XSS_ATTEMPT = 'xss_attempt',
  CLICKJACKING_ATTEMPT = 'clickjacking_attempt',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_AUTH_TOKEN = 'invalid_auth_token',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  SUSPICIOUS_LOGIN = 'suspicious_login',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  MALICIOUS_PAYLOAD = 'malicious_payload',
  CONTENT_INJECTION = 'content_injection',
  SESSION_HIJACKING = 'session_hijacking',
  DEVTOOLS_DETECTION = 'devtools_detection',
  DEBUGGING_DETECTION = 'debugging_detection'
}

interface ThreatPattern {
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

class SecurityMonitorService {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000;
  private isEnabled = true;
  private patterns: ThreatPattern[] = [];
  private rateLimitMap = new Map<string, number[]>();
  private suspiciousIPs = new Set<string>();
  private blockedIPs = new Set<string>();

  constructor() {
    this.initializeThreatPatterns();
    this.setupSecurityObservers();
    this.startPeriodicChecks();
  }

  /**
   * Initialize threat detection patterns
   */
  private initializeThreatPatterns(): void {
    this.patterns = [
      // XSS patterns
      {
        name: 'XSS Script Tag',
        pattern: /<script[^>]*>.*?<\/script>/gi,
        severity: 'high',
        description: 'Potential XSS attack using script tags'
      },
      {
        name: 'XSS JavaScript URL',
        pattern: /javascript\s*:/gi,
        severity: 'high',
        description: 'Potential XSS attack using javascript: protocol'
      },
      {
        name: 'XSS Event Handler',
        pattern: /on\w+\s*=\s*["\'][^"\']*["\']/gi,
        severity: 'medium',
        description: 'Potential XSS attack using event handlers'
      },
      // SQL Injection patterns
      {
        name: 'SQL Injection Union',
        pattern: /union\s+select/gi,
        severity: 'critical',
        description: 'Potential SQL injection using UNION SELECT'
      },
      {
        name: 'SQL Injection OR',
        pattern: /'\s*or\s*'?\d*'?\s*=\s*'?\d*/gi,
        severity: 'critical',
        description: 'Potential SQL injection using OR condition'
      },
      // Command injection patterns
      {
        name: 'Command Injection',
        pattern: /[;&|`$(){}\\]/g,
        severity: 'high',
        description: 'Potential command injection characters'
      },
      // Path traversal patterns
      {
        name: 'Path Traversal',
        pattern: /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/gi,
        severity: 'high',
        description: 'Potential path traversal attack'
      },
      // LDAP injection patterns
      {
        name: 'LDAP Injection',
        pattern: /\(\s*\|\s*\(\s*\w+\s*=\s*\*\s*\)\s*\)/gi,
        severity: 'medium',
        description: 'Potential LDAP injection'
      }
    ];
  }

  /**
   * Setup security observers and event listeners
   */
  private setupSecurityObservers(): void {
    // Monitor for frame busting attempts
    if (window !== window.top) {
      this.reportSecurityEvent({
        type: SecurityEventType.CLICKJACKING_ATTEMPT,
        severity: 'high',
        details: {
          message: 'Application loaded in iframe',
          topOrigin: window.top?.location?.origin || 'unknown',
          currentOrigin: window.location.origin
        }
      });
    }

    // Monitor console access attempts
    this.setupConsoleMonitoring();

    // Monitor DOM manipulation attempts
    this.setupDOMMonitoring();

    // Monitor network requests
    this.setupNetworkMonitoring();

    // Monitor localStorage/sessionStorage access
    this.setupStorageMonitoring();

    // Monitor for suspicious keyboard events
    this.setupKeyboardMonitoring();
  }

  /**
   * Setup console monitoring to detect debugging attempts
   */
  private setupConsoleMonitoring(): void {
    const originalConsole = { ...console };
    let consoleAccessCount = 0;

    // Override console methods to detect usage
    ['log', 'warn', 'error', 'debug', 'info'].forEach(method => {
      (console as any)[method] = (...args: any[]) => {
        consoleAccessCount++;
        
        // If console is being used frequently, might indicate debugging
        if (consoleAccessCount > 50) {
          this.reportSecurityEvent({
            type: SecurityEventType.DEBUGGING_DETECTION,
            severity: 'low',
            details: {
              method,
              accessCount: consoleAccessCount,
              message: 'Excessive console usage detected'
            }
          });
        }

        return (originalConsole as any)[method](...args);
      };
    });

    // Detect DevTools opening via timing attack
    setInterval(() => {
      const start = Date.now();
      debugger; // This will pause if DevTools is open
      const end = Date.now();

      if (end - start > 100) {
        this.reportSecurityEvent({
          type: SecurityEventType.DEVTOOLS_DETECTION,
          severity: 'low',
          details: {
            delay: end - start,
            message: 'DevTools likely open based on timing'
          }
        });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup DOM monitoring for suspicious modifications
   */
  private setupDOMMonitoring(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check for suspicious script injections
              if (element.tagName === 'SCRIPT') {
                this.reportSecurityEvent({
                  type: SecurityEventType.CONTENT_INJECTION,
                  severity: 'high',
                  details: {
                    tagName: 'SCRIPT',
                    src: element.getAttribute('src'),
                    content: element.textContent?.substring(0, 100) || '',
                    message: 'Script element dynamically added to DOM'
                  }
                });
              }

              // Check for suspicious iframe injections
              if (element.tagName === 'IFRAME') {
                this.reportSecurityEvent({
                  type: SecurityEventType.CONTENT_INJECTION,
                  severity: 'medium',
                  details: {
                    tagName: 'IFRAME',
                    src: element.getAttribute('src'),
                    message: 'Iframe element dynamically added to DOM'
                  }
                });
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    // Override fetch to monitor requests
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options] = args;
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // Check for suspicious request patterns
      this.analyzeRequest(urlString, options);
      
      try {
        const response = await originalFetch(...args);
        
        // Monitor response for security headers
        this.analyzeResponse(response);
        
        return response;
      } catch (error) {
        this.reportSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_REQUEST,
          severity: 'medium',
          details: {
            url: urlString,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Network request failed'
          }
        });
        throw error;
      }
    };
  }

  /**
   * Setup storage monitoring
   */
  private setupStorageMonitoring(): void {
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    
    let storageAccessCount = 0;

    localStorage.setItem = (key: string, value: string) => {
      storageAccessCount++;
      
      // Check for suspicious data patterns
      this.analyzeThreatPatterns(value);
      
      // Monitor excessive storage access
      if (storageAccessCount > 100) {
        this.reportSecurityEvent({
          type: SecurityEventType.DATA_EXFILTRATION,
          severity: 'medium',
          details: {
            accessCount: storageAccessCount,
            key: key.substring(0, 50),
            message: 'Excessive localStorage access detected'
          }
        });
      }

      return originalSetItem.call(localStorage, key, value);
    };

    localStorage.getItem = (key: string) => {
      storageAccessCount++;
      return originalGetItem.call(localStorage, key);
    };
  }

  /**
   * Setup keyboard monitoring for suspicious patterns
   */
  private setupKeyboardMonitoring(): void {
    let keySequence: string[] = [];
    const suspiciousSequences = [
      'F12', // DevTools
      'F10', // Step over
      'Control+Shift+I', // DevTools
      'Control+Shift+J', // Console
      'Control+U' // View source
    ];

    document.addEventListener('keydown', (event) => {
      const key = event.key;
      const combination = [
        event.ctrlKey ? 'Control' : '',
        event.shiftKey ? 'Shift' : '',
        event.altKey ? 'Alt' : '',
        key
      ].filter(Boolean).join('+');

      keySequence.push(combination);
      
      // Keep only last 10 keys
      if (keySequence.length > 10) {
        keySequence = keySequence.slice(-10);
      }

      // Check for suspicious key combinations
      if (suspiciousSequences.includes(combination)) {
        this.reportSecurityEvent({
          type: SecurityEventType.DEVTOOLS_DETECTION,
          severity: 'low',
          details: {
            keyCombination: combination,
            message: 'Suspicious key combination detected'
          }
        });
      }
    });
  }

  /**
   * Start periodic security checks
   */
  private startPeriodicChecks(): void {
    // Run security checks every 30 seconds
    setInterval(() => {
      this.performSecurityScan();
    }, 30000);

    // Clean up old events every 5 minutes
    setInterval(() => {
      this.cleanupOldEvents();
    }, 300000);
  }

  /**
   * Perform comprehensive security scan
   */
  private performSecurityScan(): void {
    // Check for frame busting bypass attempts
    if (window !== window.top) {
      this.reportSecurityEvent({
        type: SecurityEventType.CLICKJACKING_ATTEMPT,
        severity: 'high',
        details: {
          message: 'Still in iframe context',
          timestamp: Date.now()
        }
      });
    }

    // Check localStorage for suspicious patterns
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          this.analyzeThreatPatterns(value);
        }
      }
    }

    // Check for performance anomalies that might indicate attacks
    if (performance.memory) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
        this.reportSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_REQUEST,
          severity: 'medium',
          details: {
            memoryUsage: memory.usedJSHeapSize,
            memoryLimit: memory.jsHeapSizeLimit,
            message: 'High memory usage detected - possible DoS attempt'
          }
        });
      }
    }
  }

  /**
   * Analyze request for threats
   */
  private analyzeRequest(url: string, options?: RequestInit): void {
    // Check URL for suspicious patterns
    this.analyzeThreatPatterns(url);

    // Check for suspicious headers
    if (options?.headers) {
      const headers = new Headers(options.headers);
      headers.forEach((value, key) => {
        this.analyzeThreatPatterns(value);
        
        // Check for suspicious header values
        if (key.toLowerCase() === 'user-agent' && value.includes('bot')) {
          this.reportSecurityEvent({
            type: SecurityEventType.SUSPICIOUS_REQUEST,
            severity: 'low',
            details: {
              header: key,
              value: value.substring(0, 100),
              message: 'Bot user agent detected'
            }
          });
        }
      });
    }

    // Check request body for threats
    if (options?.body) {
      const bodyString = typeof options.body === 'string' 
        ? options.body 
        : options.body.toString();
      this.analyzeThreatPatterns(bodyString);
    }
  }

  /**
   * Analyze response for security issues
   */
  private analyzeResponse(response: Response): void {
    // Check for missing security headers
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'content-security-policy',
      'strict-transport-security'
    ];

    const missingHeaders = securityHeaders.filter(header => 
      !response.headers.has(header)
    );

    if (missingHeaders.length > 0) {
      this.reportSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        severity: 'low',
        details: {
          missingHeaders,
          url: response.url,
          message: 'Response missing security headers'
        }
      });
    }
  }

  /**
   * Analyze text for threat patterns
   */
  private analyzeThreatPatterns(text: string): void {
    this.patterns.forEach(pattern => {
      if (pattern.pattern.test(text)) {
        this.reportSecurityEvent({
          type: SecurityEventType.MALICIOUS_PAYLOAD,
          severity: pattern.severity,
          details: {
            patternName: pattern.name,
            description: pattern.description,
            matchedText: text.substring(0, 100),
            message: 'Malicious pattern detected'
          }
        });
      }
    });
  }

  /**
   * Report a security event
   */
  public reportSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'fingerprint' | 'userAgent' | 'url'>): void {
    if (!this.isEnabled) return;

    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
      fingerprint: this.generateFingerprint(event),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.events.push(securityEvent);

    // Keep events array manageable
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Send to error tracker for centralized monitoring
    errorTracker.addBreadcrumb({
      message: `Security Event: ${event.type}`,
      category: 'security',
      level: event.severity === 'critical' || event.severity === 'high' ? 'error' : 'warning',
      timestamp: new Date().toISOString(),
      data: event.details
    });

    // Log critical events immediately
    if (event.severity === 'critical' || event.severity === 'high') {
      console.warn(`🚨 Security Alert [${event.severity.toUpperCase()}]: ${event.type}`, event.details);
      
      // Report as error for immediate attention
      errorTracker.reportError(
        new Error(`Security violation: ${event.type}`),
        {
          customTags: {
            securityEvent: 'true',
            severity: event.severity,
            eventType: event.type
          }
        }
      );
    }

    // Auto-block for critical threats
    if (event.severity === 'critical') {
      this.handleCriticalThreat(securityEvent);
    }
  }

  /**
   * Handle critical security threats
   */
  private handleCriticalThreat(event: SecurityEvent): void {
    // Trigger security lockdown
    this.triggerSecurityLockdown(event);
    
    // Clear sensitive data
    this.clearSensitiveData();
    
    // Notify user
    this.notifyUser(event);
  }

  /**
   * Trigger security lockdown
   */
  private triggerSecurityLockdown(event: SecurityEvent): void {
    // Dispatch custom event for application to handle
    const lockdownEvent = new CustomEvent('security:lockdown', {
      detail: {
        event,
        timestamp: Date.now()
      }
    });
    
    document.dispatchEvent(lockdownEvent);
  }

  /**
   * Clear sensitive data from storage
   */
  private clearSensitiveData(): void {
    // Clear auth tokens
    localStorage.removeItem('flextasker_auth');
    sessionStorage.removeItem('flextasker_session_key');
    
    // Clear CSRF tokens
    localStorage.removeItem('flextasker_csrf_token');
    
    // Clear any cached sensitive data
    const sensitiveKeys = ['user', 'profile', 'payment', 'settings'];
    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  /**
   * Notify user of security event
   */
  private notifyUser(event: SecurityEvent): void {
    // Create user notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 10000;
      max-width: 300px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    notification.innerHTML = `
      <strong>Security Alert</strong><br>
      Suspicious activity detected. Please refresh the page and verify your account.
      <button onclick="this.parentElement.remove()" style="
        background: white;
        color: #dc3545;
        border: none;
        padding: 5px 10px;
        margin-top: 10px;
        border-radius: 3px;
        cursor: pointer;
        float: right;
      ">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Generate fingerprint for event deduplication
   */
  private generateFingerprint(event: any): string {
    const data = `${event.type}-${JSON.stringify(event.details)}`;
    let hash = 0;
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp > oneHourAgo);
  }

  /**
   * Get security summary
   */
  public getSecuritySummary(): {
    totalEvents: number;
    criticalEvents: number;
    highSeverityEvents: number;
    recentEvents: SecurityEvent[];
    threatTypes: Record<string, number>;
  } {
    const recentEvents = this.events.filter(event => 
      event.timestamp > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    );

    const threatTypes: Record<string, number> = {};
    recentEvents.forEach(event => {
      threatTypes[event.type] = (threatTypes[event.type] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      criticalEvents: this.events.filter(e => e.severity === 'critical').length,
      highSeverityEvents: this.events.filter(e => e.severity === 'high').length,
      recentEvents: recentEvents.slice(-10),
      threatTypes
    };
  }

  /**
   * Enable/disable security monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Add custom threat pattern
   */
  public addThreatPattern(pattern: ThreatPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Clear all events
   */
  public clearEvents(): void {
    this.events = [];
  }
}

// Create singleton instance
export const securityMonitor = new SecurityMonitorService();

// React hook for security monitoring
export function useSecurityMonitoring() {
  return {
    reportEvent: (event: Omit<SecurityEvent, 'timestamp' | 'fingerprint' | 'userAgent' | 'url'>) => {
      securityMonitor.reportSecurityEvent(event);
    },
    
    getSecuritySummary: () => {
      return securityMonitor.getSecuritySummary();
    },
    
    addThreatPattern: (pattern: ThreatPattern) => {
      securityMonitor.addThreatPattern(pattern);
    }
  };
}

export { SecurityEventType };
export default securityMonitor;