/**
 * Security Utilities
 * 
 * This file provides security-focused utilities to help protect the application
 * against common web vulnerabilities and implement security best practices.
 */
import { logger } from '@/services/logging';

/**
 * Content Security Policy (CSP) configuration
 * 
 * This defines the CSP that should be applied to the application.
 * In a production environment, these headers should be set by the server,
 * but this can be used to programmatically apply CSP in development
 * or in environments where server configuration is not possible.
 */
export const contentSecurityPolicy = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'img-src': ["'self'", "data:", "https://cdn.jsdelivr.net", "https://*.cloudfront.net"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'connect-src': ["'self'", import.meta.env.VITE_API_URL ?? 'http://localhost:3000'],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

/**
 * Apply Content Security Policy to document
 * Use this in development to test CSP rules
 */
export function applyCSP(): void {
  if (typeof document === 'undefined') return;
  
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  
  const policyString = Object.entries(contentSecurityPolicy)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
    
  meta.content = policyString;
  document.head.appendChild(meta);
}

/**
 * Generate a nonce for inline scripts
 * This helps with CSP when you need to include inline scripts
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRF protection token handling
 */
export class CSRFProtection {
  private static tokenName = 'flextasker_csrf_token';
  
  /**
   * Generate a new CSRF token
   */
  public static generateToken(): string {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Store the token in localStorage for persistence
    localStorage.setItem(this.tokenName, token);
    return token;
  }
  
  /**
   * Get the current CSRF token or generate a new one
   */
  public static getToken(): string {
    let token = localStorage.getItem(this.tokenName);
    
    if (!token) {
      token = this.generateToken();
    }
    
    return token;
  }
  
  /**
   * Create headers with CSRF token
   */
  public static getHeaders(): HeadersInit {
    return {
      'X-CSRF-Token': this.getToken()
    };
  }
  
  /**
   * Verify a response has a valid CSRF token
   */
  public static verifyResponse(response: Response): boolean {
    const responseToken = response.headers.get('X-CSRF-Token');
    if (!responseToken) return false;
    
    const storedToken = this.getToken();
    return responseToken === storedToken;
  }
}

/**
 * Content sanitization utilities to prevent XSS attacks
 */
export class Sanitizer {
  /**
   * Sanitize HTML string to prevent XSS
   */
  public static sanitizeHTML(html: string): string {
    const element = document.createElement('div');
    element.textContent = html;
    return element.innerHTML;
  }
  
  /**
   * Sanitize URL to prevent javascript: protocol attacks
   */
  public static sanitizeURL(url: string): string | null {
    try {
      const parsedURL = new URL(url, window.location.origin);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedURL.protocol)) {
        return null;
      }
      
      return parsedURL.toString();
    } catch (e) {
      // For relative URLs that can't be parsed, validate they don't start with javascript:
      if (url.trim().toLowerCase().startsWith('javascript:')) {
        return null;
      }
      
      return url;
    }
  }
  
  /**
   * Sanitize a filename to ensure it's safe
   */
  public static sanitizeFileName(filename: string): string {
    // Remove any path traversal characters and dangerous characters
    return filename.replace(/[\\/:*?"<>|]/g, '');
  }
}

/**
 * Session security utilities
 */
export class SessionSecurity {
  /**
   * Encrypt sensitive data for local storage
   * Note: This is not truly secure as the key is in the client,
   * but provides a basic level of obfuscation
   */
  public static encryptData(data: any, key: string): string {    try {
      // Simple XOR encryption - for truly sensitive data, use a proper encryption library
      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      const encryptedArray = Array.from(stringData).map((char, index) => {
        // XOR each character with the corresponding character in the key
        return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length));
      });
      
      // Base64 encode the result
      return btoa(encryptedArray.join(''));
    } catch (e) {
      logger.error('Encryption error', { error: e });
      return '';
    }
  }
  
  /**
   * Decrypt data from local storage
   */
  public static decryptData<T>(encryptedData: string, key: string): T | null {    try {
      // Base64 decode
      const decodedData = atob(encryptedData);
      
      // XOR decrypt
      const decryptedArray = Array.from(decodedData).map((char, index) => {
        return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length));
      });
      
      const decryptedString = decryptedArray.join('');
      return JSON.parse(decryptedString) as T;
    } catch (e) {
      logger.error('Decryption error', { error: e });
      return null;
    }
  }
  
  /**
   * Check for basic security vulnerabilities
   */
  public static checkVulnerabilities(): string[] {
    const vulnerabilities: string[] = [];
    
    // Check if running in a frame - potential clickjacking vulnerability
    if (window !== window.top) {
      vulnerabilities.push('Application is running in a frame, which may indicate a clickjacking attempt.');
    }
    
    // Check if localStorage is being modified by another source
    const testKey = '___security_test___';
    const testValue = Date.now().toString();
    
    try {
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      
      if (retrieved !== testValue) {
        vulnerabilities.push('LocalStorage may be compromised or modified by another source.');
      }
      
      localStorage.removeItem(testKey);
    } catch (e) {
      vulnerabilities.push('Unable to access localStorage. Private browsing or storage quota exceeded.');
    }
      // Detect DevTools - not a security feature but can be used to notify users that DevTools is open
    // This can discourage some basic inspection/tampering
    if (
      //@ts-ignore - Using non-standard properties for detection
      (window.devtools && window.devtools.open) || 
      // Check for Firefox and Chrome dev tools using window size difference
      (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160)
    ) {
      vulnerabilities.push('Developer tools may be open.');
      logger.debug('Developer tools detected as open');
    }
    
    return vulnerabilities;
  }
  
  /**
   * Detect if the application is being debugged
   * Note: This is not foolproof but can discourage basic tampering
   */
  public static isBeingDebugged(): boolean {
    const dateStart = Date.now();
      // This operation will take much longer when a breakpoint is set or when stepping through code
    for (let i = 0; i < 1000000; i++) {
      // Do nothing intensive
      i * i; // Simple calculation without storing the value
    }
    
    const dateEnd = Date.now();
    
    // If execution took significantly longer than expected, debugging might be happening
    return (dateEnd - dateStart) > 100; // normal execution should be a few ms
  }
}

/**
 * Authentication security utilities
 */
export class AuthSecurity {
  /**
   * Check if a token is expired
   */
  public static isTokenExpired(token: string): boolean {    try {
      // JWT tokens have three parts separated by dots
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        return true; // Not a valid JWT token
      }
      
      // The second part is the payload, which is base64url encoded
      const payload = parts[1];
      
      // Convert base64url to base64 by replacing characters
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      
      // Decode and parse the payload
      const decodedPayload = JSON.parse(atob(base64));
      
      // Check if the token has an expiration claim
      if (!decodedPayload.exp) {
        return false; // No expiration, assume it's valid
      }
      
      // Compare the expiration timestamp with the current time
      // exp is in seconds, Date.now() is in milliseconds
      return decodedPayload.exp * 1000 < Date.now();
    } catch (e) {
      logger.error('Error checking token expiration', { error: e });
      return true; // Assume expired if there was an error
    }
  }
  
  /**
   * Extract user info from a JWT token
   */
  public static decodeToken<T>(token: string): T | null {    try {
      // JWT tokens have three parts separated by dots
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        return null; // Not a valid JWT token
      }
      
      // The second part is the payload, which is base64url encoded
      const payload = parts[1];
      
      // Convert base64url to base64 by replacing characters
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      
      // Decode and parse the payload
      return JSON.parse(atob(base64)) as T;
    } catch (e) {
      logger.error('Error decoding token', { error: e });
      return null;
    }
  }
  
  /**
   * Securely store authentication data
   * Note: For high-security applications, consider using a more secure storage method
   */
  public static storeAuthData(token: string, refreshToken?: string): void {
    // Store tokens with a timestamp for expiration checking
    const authData = {
      token,
      refreshToken,
      timestamp: Date.now()
    };
    
    // Use session key to encrypt
    const sessionKey = this.getSessionKey();
    const encryptedData = SessionSecurity.encryptData(authData, sessionKey);
    
    localStorage.setItem('flextasker_auth', encryptedData);
  }
  
  /**
   * Retrieve stored authentication data
   */
  public static getAuthData(): { token: string; refreshToken?: string; timestamp: number } | null {
    const encryptedData = localStorage.getItem('flextasker_auth');
    
    if (!encryptedData) {
      return null;
    }
    
    // Use session key to decrypt
    const sessionKey = this.getSessionKey();
    return SessionSecurity.decryptData<{ token: string; refreshToken?: string; timestamp: number }>(
      encryptedData, 
      sessionKey
    );
  }
  
  /**
   * Get or create a session key
   * This key is used for encrypting auth data
   */
  private static getSessionKey(): string {
    let sessionKey = sessionStorage.getItem('flextasker_session_key');
    
    if (!sessionKey) {
      // Generate a random session key
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      sessionKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      
      sessionStorage.setItem('flextasker_session_key', sessionKey);
    }
    
    return sessionKey;
  }
  
  /**
   * Clear all authentication data
   */
  public static clearAuthData(): void {
    localStorage.removeItem('flextasker_auth');
    sessionStorage.removeItem('flextasker_session_key');
  }
}

/**
 * Add security headers for the application
 * This is primarily for information - headers should be set at the server level
 */
export const RECOMMENDED_SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Enable XSS filtering in browsers that support it
  'X-XSS-Protection': '1; mode=block',
  
  // Control browser features
  'Feature-Policy': "camera 'none'; microphone 'none'; geolocation 'self'",
  
  // Specify permitted sources for content
  'Content-Security-Policy': 'default-src \'self\'',
  
  // HTTP Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // Referrer Policy
  'Referrer-Policy': 'same-origin'
};

/**
 * Apply security related event listeners
 */
export function setupSecurityEventListeners(): void {
  // Listen for visibility changes to detect when a user returns to the tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Verify tokens are still valid
      const authData = AuthSecurity.getAuthData();
      
      if (authData && authData.token) {
        // Check if token is expired
        if (AuthSecurity.isTokenExpired(authData.token)) {
          // Handle expired token - trigger refresh or logout
          const event = new CustomEvent('auth:token-expired');
          document.dispatchEvent(event);
        }
      }
    }
  });
}

/**
 * Export all security utilities
 */
export default {
  contentSecurityPolicy,
  applyCSP,
  generateNonce,
  CSRFProtection,
  Sanitizer,
  SessionSecurity,
  AuthSecurity,
  RECOMMENDED_SECURITY_HEADERS,
  setupSecurityEventListeners
};
