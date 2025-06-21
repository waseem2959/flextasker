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
  'connect-src': ["'self'", 'http://localhost:3000'],
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
  private static tokenName = 'csrf_token';
  
  /**
   * Generate a new CSRF token
   */
  public static generateToken(): string {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Store the token in a cookie
    document.cookie = `${this.tokenName}=${token}; path=/; SameSite=Strict`;
    return token;
  }
  
  /**
   * Get the current CSRF token from cookie
   */
  public static getToken(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.tokenName) {
        return value;
      }
    }
    return null;
  }
  
  /**
   * Create headers with CSRF token
   */
  public static getHeaders(): HeadersInit {
    const token = this.getToken();
    return token ? { 'X-CSRF-Token': token } : {};
  }
  
  /**
   * Validate a token against the stored token
   */
  public static validateToken(token: string | null): boolean {
    if (!token) return false;
    const storedToken = this.getToken();
    return token === storedToken;
  }
  
  /**
   * Clear the CSRF token
   */
  public static clearToken(): void {
    document.cookie = `${this.tokenName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
  
  /**
   * Refresh the CSRF token
   */
  public static refreshToken(): string {
    this.clearToken();
    return this.generateToken();
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
  private static AUTH_KEY_NAME = 'auth_key';
  private static AUTH_TOKENS_NAME = 'auth_tokens';
  
  /**
   * Generate encryption key
   */
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Store the encryption key
   */
  private static async storeKey(key: CryptoKey): Promise<void> {
    const exported = await crypto.subtle.exportKey('jwk', key);
    localStorage.setItem(this.AUTH_KEY_NAME, JSON.stringify(exported));
  }
  
  /**
   * Get or create encryption key
   */
  private static async getKey(): Promise<CryptoKey> {
    const storedKey = localStorage.getItem(this.AUTH_KEY_NAME);
    
    if (storedKey) {
      const jwk = JSON.parse(storedKey);
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );
    }
    
    const key = await this.generateKey();
    await this.storeKey(key);
    return key;
  }
  
  /**
   * Securely store authentication data
   */
  public static async storeAuthData(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      const authData = {
        accessToken,
        refreshToken
      };
      
      const key = await this.getKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      const dataString = JSON.stringify(authData);
      const encodedData = new TextEncoder().encode(dataString);
      
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encodedData
      );
      
      const storedData = {
        encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
        iv: btoa(String.fromCharCode(...iv)),
        salt: btoa(String.fromCharCode(...salt))
      };
      
      localStorage.setItem(this.AUTH_TOKENS_NAME, JSON.stringify(storedData));
    } catch (error) {
      // Fall back to plain storage if encryption fails
      const authData = { accessToken, refreshToken };
      localStorage.setItem(this.AUTH_TOKENS_NAME, JSON.stringify(authData));
    }
  }
  
  /**
   * Retrieve stored authentication data
   */
  public static async getAuthData(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
      const storedDataString = localStorage.getItem(this.AUTH_TOKENS_NAME);
      
      if (!storedDataString) {
        return { accessToken: null, refreshToken: null };
      }
      
      const storedData = JSON.parse(storedDataString);
      
      // Check if it's encrypted data
      if (storedData.encryptedData && storedData.iv) {
        const key = await this.getKey();
        
        const encryptedArray = new Uint8Array(
          atob(storedData.encryptedData).split('').map(c => c.charCodeAt(0))
        );
        const iv = new Uint8Array(
          atob(storedData.iv).split('').map(c => c.charCodeAt(0))
        );
        
        const decryptedData = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv
          },
          key,
          encryptedArray
        );
        
        const decodedData = new TextDecoder().decode(decryptedData);
        return JSON.parse(decodedData);
      } else {
        // Plain text fallback
        return {
          accessToken: storedData.accessToken || null,
          refreshToken: storedData.refreshToken || null
        };
      }
    } catch (error) {
      return { accessToken: null, refreshToken: null };
    }
  }
  
  /**
   * Clear all authentication data
   */
  public static clearAuthData(): void {
    localStorage.removeItem(this.AUTH_TOKENS_NAME);
    localStorage.removeItem(this.AUTH_KEY_NAME);
  }
  
  /**
   * Check if a token is expired
   */
  public static isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    
    try {
      const payload = this.getTokenPayload(token);
      if (!payload || !payload.exp) return true;
      
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      return true;
    }
  }
  
  /**
   * Get token payload
   */
  public static getTokenPayload(token: string | null): any {
    if (!token) return null;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(base64));
      
      return decodedPayload;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Extract user info from a JWT token
   */
  public static decodeToken<T>(token: string): T | null {
    return this.getTokenPayload(token) as T;
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
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      // Verify tokens are still valid
      const authData = await AuthSecurity.getAuthData();
      
      if (authData && authData.accessToken) {
        // Check if token is expired
        if (AuthSecurity.isTokenExpired(authData.accessToken)) {
          // Handle expired token - trigger refresh or logout
          const event = new CustomEvent('auth:token-expired');
          document.dispatchEvent(event);
        }
      }
    }
  });
}

// Export individual functions for backward compatibility
export const sanitizeHtml = Sanitizer.sanitizeHTML;
export const sanitizeHTML = Sanitizer.sanitizeHTML; // Alias for consistency
export const validateCSRFToken = (token: string): boolean => {
  const storedToken = CSRFProtection.getToken();
  return token === storedToken;
};

/**
 * Initialize the authentication system
 * 
 * This function should be called early in the application lifecycle,
 * typically before rendering the app.
 */
export async function initializeAuth(): Promise<void> {
  try {
    // Set up security event listeners for token refresh and session management
    setupSecurityEventListeners();
    
    // Get auth data using the secure AuthSecurity class
    const authData = await AuthSecurity.getAuthData();
    if (authData?.accessToken && AuthSecurity.isTokenExpired(authData.accessToken)) {
      // Token is expired, clear it to trigger re-login
      AuthSecurity.clearAuthData();
      console.warn('Expired authentication token detected and cleared');
    }
    
    // Log success
    console.info('Auth initialization successful');
  } catch (error) {
    // Log error but don't crash the application
    console.error('Failed to initialize authentication system', { error });
  }
}

/**
 * Check if the user is authenticated
 * 
 * @returns Promise that resolves to true if the user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const authData = await AuthSecurity.getAuthData();
    return !!authData?.accessToken && !AuthSecurity.isTokenExpired(authData.accessToken);
  } catch {
    return false;
  }
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
  setupSecurityEventListeners,
  sanitizeHtml,
  sanitizeHTML,
  validateCSRFToken,
  initializeAuth,
  isAuthenticated
};
