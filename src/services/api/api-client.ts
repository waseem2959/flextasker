/**
 * API Client
 * 
 * This service provides a consistent and type-safe way to interact with the API,
 * handling common concerns like error handling, authentication, and request formatting.
 */

import { config } from '../../config';
// Cache service removed for simplicity
// Performance monitoring removed for simplicity
import {
    ApiClientConfig,
    ApiError,
    ApiResponse
} from '../../../shared/types/common/api-types';
import { ErrorType, HttpStatusCode } from '../../../shared/types/common/enums';
import {
    AppError,
    AuthenticationError,
    createErrorFromType,
    NetworkError,
    NotFoundError,
    ServerError,
    TimeoutError,
    ValidationError
} from '../../../shared/types/common/error-types';
import { CSRFProtection, AuthSecurity } from '../../utils/security';
import { rateLimiter } from '../security/rate-limiter';
import { securityMonitor, SecurityEventType } from '../security/security-monitor';
import { performanceMonitor } from '../monitoring/performance-monitor';

/**
 * Enhanced fetch options that extends the standard RequestInit
 * with additional properties specific to our API client
 */
export interface EnhancedRequestInit extends Omit<RequestInit, 'cache'> {
  // Set timeout in milliseconds
  timeout?: number;
  
  // Cache options (separate from the standard cache property)
  // Cache options removed for simplicity
  
  // Error handling options
  suppressErrors?: boolean;
  errorHandlers?: Record<number, (error: ApiError) => void>;
  
  // Retry options
  retry?: {
    maxRetries: number;
    retryDelay: number;
    retryStatusCodes: number[];
  };
}

/**
 * Default request options
 */
const DEFAULT_OPTIONS: EnhancedRequestInit = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds
  retry: {
    maxRetries: 2,
    retryDelay: 1000, // 1 second
    retryStatusCodes: [408, 429, 500, 502, 503, 504], // Retryable status codes
  },
};

/**
 * API Client class
 */
export class ApiClient {
  private baseUrl: string;
  private defaultOptions: EnhancedRequestInit;
  private authToken: string | null = null;
  
  /**
   * Create a new API client
   */
  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultOptions = {
      ...DEFAULT_OPTIONS,
      ...config,
      headers: {
        ...DEFAULT_OPTIONS.headers,
        ...(config.headers || {}),
      },
      timeout: config.timeout ?? DEFAULT_OPTIONS.timeout,
      retry: config.retry ? {
        maxRetries: config.retry.maxRetries,
        retryDelay: config.retry.retryDelay,
        retryStatusCodes: config.retry.retryStatusCodes,
      } : DEFAULT_OPTIONS.retry,
    };
    
    if (config.authToken) {
      this.setAuthToken(config.authToken);
    }
  }
  
  /**
   * Set the authentication token
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }
  
  /**
   * Get the authentication token
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }
  
  /**
   * Create a new request with the default options
   */
  private async createRequest(endpoint: string, options: EnhancedRequestInit = {}): Promise<Request> {
    const url = new URL(endpoint, this.baseUrl);
    
    // Check rate limiting before creating request
    const method = options.method || 'GET';
    const rateLimitCheck = rateLimiter.isAllowed('api_requests');
    
    if (!rateLimitCheck.allowed) {
      securityMonitor.reportSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'medium',
        details: {
          endpoint,
          method,
          remaining: rateLimitCheck.remaining,
          retryAfter: rateLimitCheck.retryAfter,
          message: 'API rate limit exceeded'
        }
      });
      
      throw new AppError(
        'Rate limit exceeded. Please try again later.',
        ErrorType.RATE_LIMIT,
        'RATE_LIMIT_EXCEEDED',
        HttpStatusCode.TOO_MANY_REQUESTS
      );
    }
    
    // Merge headers
    const headers = new Headers(this.defaultOptions.headers as HeadersInit);
    
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          headers.set(key, String(value));
        }
      });
    }
    
    // Add auth token if available (prefer current instance token over stored)
    const authData = await AuthSecurity.getAuthData();
    const currentToken = this.authToken || authData?.accessToken;
    if (currentToken && !AuthSecurity.isTokenExpired(currentToken)) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    } else if (currentToken && AuthSecurity.isTokenExpired(currentToken)) {
      // Report expired token
      securityMonitor.reportSecurityEvent({
        type: SecurityEventType.INVALID_AUTH_TOKEN,
        severity: 'medium',
        details: {
          endpoint,
          message: 'Expired authentication token detected'
        }
      });
      
      // Clear expired token
      AuthSecurity.clearAuthData();
    }
    
    // Add CSRF protection for non-GET requests
    if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
      Object.entries(CSRFProtection.getHeaders()).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
    
    // Add security headers
    headers.set('X-Requested-With', 'XMLHttpRequest');
    headers.set('X-Client-Version', config.version || '1.0.0');
    headers.set('X-Timestamp', Date.now().toString());
    
    // Validate request body for security threats
    if (options.body && typeof options.body === 'string') {
      this.validateRequestSecurity(options.body, endpoint);
    }
    
    // Create request init without our custom properties
    const { timeout, suppressErrors, errorHandlers, retry, ...requestInit } = {
      ...this.defaultOptions,
      ...options,
      headers
    };
    
    // Create the request
    return new Request(url.toString(), requestInit);
  }

  /**
   * Validate request for security threats
   */
  private validateRequestSecurity(body: string, endpoint: string): void {
    // Check for suspicious patterns in request body
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /'\s*or\s*'?\d*'?\s*=\s*'?\d*/i,
      /\.\.\//,
      /\$\{.*\}/
    ];

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(body)) {
        securityMonitor.reportSecurityEvent({
          type: SecurityEventType.MALICIOUS_PAYLOAD,
          severity: 'high',
          details: {
            endpoint,
            pattern: pattern.toString(),
            bodySnippet: body.substring(0, 100),
            message: 'Suspicious pattern detected in request body'
          }
        });
      }
    });

    // Check for excessively large payloads
    if (body.length > 1024 * 1024) { // 1MB
      securityMonitor.reportSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        severity: 'medium',
        details: {
          endpoint,
          bodySize: body.length,
          message: 'Unusually large request payload detected'
        }
      });
    }
  }
  
  /**
   * Parse the response based on content type
   */
  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType) {
      return null;
    }
    
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }
    
    if (contentType.includes('text/plain') || contentType.includes('text/html')) {
      return response.text();
    }
    
    if (contentType.includes('application/octet-stream')) {
      return response.blob();
    }
    
    return response.text();
  }
  
  /**
   * Handle API errors
   */
  private handleApiError(response: Response, data: any): AppError {
    // Handle JSON error responses
    if (data && typeof data === 'object' && data.error) {
      const { error } = data;
      
      // Create appropriate error type based on the error data
      if (error.type && Object.values(ErrorType).includes(error.type)) {
        return createErrorFromType(
          error.type,
          error.message ?? 'API error',
          error.code,
          error.details,
          error.path
        );
      }
      
      // Create a generic error
      return new AppError(
        error.message ?? 'API error',
        ErrorType.UNKNOWN,
        error.code ?? 'API_ERROR',
        response.status as HttpStatusCode
      );
    }
    
    // Handle different status codes
    switch (response.status) {
      case HttpStatusCode.UNAUTHORIZED:
        return new AuthenticationError('Unauthorized');
        
      case HttpStatusCode.NOT_FOUND:
        return new NotFoundError('Resource not found');
        
      case HttpStatusCode.UNPROCESSABLE_ENTITY:
        return new ValidationError('Validation failed');
        
      case HttpStatusCode.INTERNAL_SERVER_ERROR:
      case HttpStatusCode.SERVICE_UNAVAILABLE:
        return new ServerError(`Server error: ${response.statusText}`);
        
      default:
        return new AppError(
          `Request failed with status ${response.status}`,
          ErrorType.UNKNOWN,
          'API_ERROR',
          response.status as HttpStatusCode
        );
    }
  }
  
  /**
   * Execute an API request with timing and monitoring
   */
  private async executeRequest<T>(
    request: Request,
    options: EnhancedRequestInit
  ): Promise<ApiResponse<T>> {
    const endpoint = new URL(request.url).pathname;
    const method = request.method;
    const startTime = performance.now();
    
    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new TimeoutError(`Request to ${endpoint} timed out after ${options.timeout}ms`));
        }, options.timeout);
      });
      
      // Execute the fetch request
      const response = await Promise.race([
        fetch(request),
        timeoutPromise,
      ]);
      
      const endTime = performance.now();
      // const responseTime = endTime - startTime; // Not currently used
      
      // Track API performance
      performanceMonitor.trackAPICall(
        endpoint,
        method,
        startTime,
        endTime,
        response.status
      );
      
      // Record rate limit request
      rateLimiter.recordRequest('api_requests', undefined, response.ok);
      
      // Validate response security
      this.validateResponseSecurity(response, endpoint);
      
      // Parse response data
      const data = await this.parseResponse(response);
      
      // Handle successful response
      if (response.ok) {
        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: response.headers.get('x-request-id') ?? undefined,
          },
        };
      }
      
      // Handle error response
      const error = this.handleApiError(response, data);
      
      // Track failed request
      performanceMonitor.trackAPICall(
        endpoint,
        method,
        startTime,
        endTime,
        response.status,
        error.message
      );
      
      // Report security events for certain error types
      if (response.status === HttpStatusCode.UNAUTHORIZED) {
        securityMonitor.reportSecurityEvent({
          type: SecurityEventType.INVALID_AUTH_TOKEN,
          severity: 'medium',
          details: {
            endpoint,
            status: response.status,
            message: 'Authentication failed'
          }
        });
      } else if (response.status === HttpStatusCode.FORBIDDEN) {
        securityMonitor.reportSecurityEvent({
          type: SecurityEventType.PRIVILEGE_ESCALATION,
          severity: 'high',
          details: {
            endpoint,
            status: response.status,
            message: 'Access forbidden - possible privilege escalation attempt'
          }
        });
      }
      
      // Return error response
      return {
        success: false,
        error: error.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('x-request-id') ?? undefined,
        },
      };
    } catch (error) {
      const endTime = performance.now();
      
      // Create appropriate error type
      let apiError: AppError;
      
      if (error instanceof AppError) {
        apiError = error;
      } else if (error instanceof TypeError && error.message.includes('NetworkError')) {
        apiError = new NetworkError('Network error: Unable to connect to the server');
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        apiError = new NetworkError('Network error: Failed to fetch');
      } else if (error instanceof TimeoutError) {
        apiError = error;
      } else {
        apiError = new AppError(
          error instanceof Error ? error.message : 'Unknown error',
          ErrorType.UNKNOWN,
          'UNKNOWN_ERROR',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
      
      // Track failed request
      performanceMonitor.trackAPICall(
        endpoint,
        method,
        startTime,
        endTime,
        0,
        apiError.message
      );
      
      // Report network security events
      if (apiError instanceof NetworkError) {
        securityMonitor.reportSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_REQUEST,
          severity: 'medium',
          details: {
            endpoint,
            error: apiError.message,
            message: 'Network error during API request'
          }
        });
      }
      
      // Return error response
      return {
        success: false,
        error: apiError.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Validate response for security issues
   */
  private validateResponseSecurity(response: Response, endpoint: string): void {
    // Check for missing security headers
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection'
    ];

    const missingHeaders = requiredHeaders.filter(header => 
      !response.headers.has(header)
    );

    if (missingHeaders.length > 0) {
      securityMonitor.reportSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        severity: 'low',
        details: {
          endpoint,
          missingHeaders,
          message: 'Response missing security headers'
        }
      });
    }

    // Check for suspicious redirects
    if (response.redirected) {
      const redirectUrl = response.url;
      if (!redirectUrl.startsWith(this.baseUrl)) {
        securityMonitor.reportSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_REQUEST,
          severity: 'high',
          details: {
            endpoint,
            redirectUrl,
            message: 'Response redirected to external domain'
          }
        });
      }
    }

    // Check response time for timing attacks
    const responseTime = response.headers.get('x-response-time');
    if (responseTime && parseInt(responseTime) > 10000) { // > 10 seconds
      securityMonitor.reportSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        severity: 'medium',
        details: {
          endpoint,
          responseTime,
          message: 'Unusually slow response time detected'
        }
      });
    }
  }
  
  /**
   * Execute a request with retries
   */
  private async executeWithRetries<T>(
    request: Request,
    options: EnhancedRequestInit
  ): Promise<ApiResponse<T>> {
    const { retry } = options;
    
    if (!retry || retry.maxRetries <= 0) {
      return this.executeRequest<T>(request, options);
    }
    
    let lastError: ApiResponse<T> | null = null;
    
    for (let attempt = 0; attempt <= retry.maxRetries; attempt++) {
      // Execute the request
      const response = await this.executeRequest<T>(request, options);
      
      // Return successful response
      if (response.success) {
        return response;
      }
      
      // Store the error
      lastError = response;
      
      // Check if we should retry
      const shouldRetry = response.error && 
        retry.retryStatusCodes.includes(response.error.status) &&
        attempt < retry.maxRetries;
      
      if (!shouldRetry) {
        break;
      }
      
      // Wait before retrying
      const delay = retry.retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return lastError!;
  }
  
  /**
   * Execute a cached request
   */
  private async executeWithCache<T>(
    request: Request,
    options: EnhancedRequestInit
  ): Promise<ApiResponse<T>> {
    // Cache functionality removed for simplicity
    
    // Cache functionality removed - always execute with retries
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Make a GET request
   */
  public async get<T>(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Build URL with query parameters
    let url = endpoint;
    
    if (queryParams) {
      const params = new URLSearchParams();
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    // Create the request
    const request = await this.createRequest(url, {
      method: 'GET',
      ...options,
    });
    
    return this.executeWithCache<T>(request, options);
  }
  
  /**
   * Make a POST request
   */
  public async post<T>(
    endpoint: string,
    data?: any,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Create the request
    const request = await this.createRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Make a PUT request
   */
  public async put<T>(
    endpoint: string,
    data?: any,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Create the request
    const request = await this.createRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Make a PATCH request
   */
  public async patch<T>(
    endpoint: string,
    data?: any,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Create the request
    const request = await this.createRequest(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Make a DELETE request
   */
  public async delete<T>(
    endpoint: string,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Create the request
    const request = await this.createRequest(endpoint, {
      method: 'DELETE',
      ...options,
    });
    
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Upload a file
   */
  public async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, any>,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Create form data
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Add additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    
    // Create the request with modified headers for FormData
    const { headers, ...restOptions } = options;
    const request = await this.createRequest(endpoint, {
      method: 'POST',
      body: formData,
      ...restOptions,
    });
    
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Download a file
   */
  public async downloadFile(
    endpoint: string,
    options: EnhancedRequestInit = {}
  ): Promise<Blob> {
    // Create the request
    const request = await this.createRequest(endpoint, {
      method: 'GET',
      ...options,
    });
    
    // Execute the request directly without using executeWithRetries
    // since we need the raw response
    const response = await fetch(request);
    
    if (!response.ok) {
      throw this.handleApiError(response, await this.parseResponse(response));
    }
    
    return response.blob();
  }
}

/**
 * Create an API client instance with the default configuration
 */
export const createApiClient = (baseUrl?: string): ApiClient => {
  return new ApiClient({
    baseUrl: baseUrl ?? config.apiUrl,
    timeout: 30000,
    retry: {
      maxRetries: 2,
      retryDelay: 1000,
      retryStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  });
};

/**
 * Default API client instance
 */
export const apiClient = createApiClient();

export default apiClient;
