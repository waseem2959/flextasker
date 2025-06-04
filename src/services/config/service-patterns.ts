/**
 * Service Pattern Templates and Standards
 * 
 * This file defines the standard patterns for all services in the application
 * to ensure consistency and maintainability.
 */

/**
 * Standard service interface that all services should implement
 */
export interface ServiceInterface {
  // Core service identifier
  readonly serviceName: string;
  
  // Initialization and cleanup methods
  init?(): Promise<void> | void;
  cleanup?(): Promise<void> | void;
  
  // Health check for service status
  healthCheck?(): Promise<boolean> | boolean;
}

/**
 * Standard API service interface for CRUD operations
 */
export interface ApiServiceInterface<TEntity, TCreateData, TUpdateData> extends ServiceInterface {
  // Read operations
  getAll(params?: Record<string, any>): Promise<TEntity[]>;
  getById(id: string): Promise<TEntity>;
  
  // Write operations
  create(data: TCreateData): Promise<TEntity>;
  update(id: string, data: TUpdateData): Promise<TEntity>;
  delete(id: string): Promise<boolean>;
}

/**
 * Standard error handling for services
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Standard service result wrapper for consistent responses
 */
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Helper function to create consistent service results
 */
export function createServiceResult<T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string
): ServiceResult<T> {
  return {
    success,
    data,
    message,
    error
  };
}

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  // Environment settings
  environment: 'development' | 'production' | 'test';
  
  // API configuration
  apiBaseUrl: string;
  timeout: number;
  
  // Feature flags
  enableLogging: boolean;
  enableCaching: boolean;
  enableOfflineMode: boolean;
  
  // Security settings
  requireAuth: boolean;
  validateTokens: boolean;
}

/**
 * Default service configuration
 */
export const defaultServiceConfig: ServiceConfig = {
  environment: 'development',
  apiBaseUrl: '/api',
  timeout: 30000,
  enableLogging: true,
  enableCaching: true,
  enableOfflineMode: true,
  requireAuth: true,
  validateTokens: true
};

/**
 * Service registry for managing all services
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private readonly services = new Map<string, ServiceInterface>();
  
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }
  
  /**
   * Register a service
   */
  register<T extends ServiceInterface>(service: T): void {
    this.services.set(service.serviceName, service);
  }
  
  /**
   * Get a registered service
   */
  get<T extends ServiceInterface>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T;
  }
  
  /**
   * Initialize all registered services
   */
  async initializeAll(): Promise<void> {
    for (const [name, service] of this.services) {
      if (service.init) {
        try {
          await service.init();
          console.log(`✓ Service ${name} initialized successfully`);
        } catch (error) {
          console.error(`✗ Service ${name} initialization failed:`, error);
        }
      }
    }
  }
  
  /**
   * Health check for all services
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, service] of this.services) {
      if (service.healthCheck) {
        try {
          results[name] = await service.healthCheck();
        } catch (error) {
          console.error(`Health check failed for ${name}:`, error);
          results[name] = false;
        }
      } else {
        results[name] = true; // Assume healthy if no health check
      }
    }
    
    return results;
  }
  
  /**
   * Cleanup all services
   */
  async cleanupAll(): Promise<void> {
    for (const [name, service] of this.services) {
      if (service.cleanup) {
        try {
          await service.cleanup();
          console.log(`✓ Service ${name} cleaned up successfully`);
        } catch (error) {
          console.error(`✗ Service ${name} cleanup failed:`, error);
        }
      }
    }
  }
}

/**
 * Decorator for service methods to add consistent error handling
 */
export function serviceMethod(serviceName: string, operationName: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        throw new ServiceError(
          `Operation ${operationName} failed in ${serviceName}`,
          serviceName,
          operationName,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };
    
    return descriptor;
  };
}

/**
 * Export the singleton service registry
 */
export const serviceRegistry = ServiceRegistry.getInstance();
