/**
 * Service Registry and Discovery
 * 
 * This module provides service registration, discovery, and health monitoring
 * to support microservices architecture and distributed systems.
 */

import { EventEmitter } from 'events';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { config } from './config';

// Service types
export enum ServiceType {
  API_GATEWAY = 'api-gateway',
  AUTH_SERVICE = 'auth-service',
  USER_SERVICE = 'user-service',
  TASK_SERVICE = 'task-service',
  NOTIFICATION_SERVICE = 'notification-service',
  PAYMENT_SERVICE = 'payment-service',
  FILE_SERVICE = 'file-service',
  SEARCH_SERVICE = 'search-service',
  ANALYTICS_SERVICE = 'analytics-service'
}

// Service status
export enum ServiceStatus {
  UP = 'up',
  DOWN = 'down',
  STARTING = 'starting',
  STOPPING = 'stopping',
  UNKNOWN = 'unknown'
}

// Also expose status on ServiceType for backward compatibility
export namespace ServiceType {
  export const UP = ServiceStatus.UP;
  export const DOWN = ServiceStatus.DOWN;
  export const STARTING = ServiceStatus.STARTING;
  export const STOPPING = ServiceStatus.STOPPING;
  export const UNKNOWN = ServiceStatus.UNKNOWN;
}

// Service instance interface
export interface ServiceInstance {
  id: string;
  name: string;
  type: ServiceType;
  host: string;
  port: number;
  url: string;
  healthCheckUrl: string;
  status: ServiceStatus;
  metadata: Record<string, any>;
  lastHeartbeat: Date;
  registeredAt: Date;
}

// Service discovery events
export enum ServiceEvents {
  REGISTERED = 'service:registered',
  DEREGISTERED = 'service:deregistered',
  STATUS_CHANGED = 'service:status-changed',
  DISCOVERED = 'service:discovered'
}

/**
 * Service Registry class
 * Manages service registration, discovery, and health monitoring
 */
class ServiceRegistry extends EventEmitter {
  private readonly services: Map<string, ServiceInstance> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentServiceId: string | null = null;
  
  constructor() {
    super();
    
    // Set max listeners
    this.setMaxListeners(100);
    
    // Start health check interval
    this.startHealthChecks();
    
    // Start heartbeat interval for this service
    this.startHeartbeat();
    
    logger.info('Service registry initialized');
  }
  
  /**
   * Register a service instance
   * 
   * @param service Service instance to register
   * @returns The registered service instance
   */
  public registerService(service: Omit<ServiceInstance, 'id' | 'registeredAt' | 'lastHeartbeat'>): ServiceInstance {
    const id = uuidv4();
    const now = new Date();
    
    const serviceInstance: ServiceInstance = {
      ...service,
      id,
      registeredAt: now,
      lastHeartbeat: now
    };
    
    this.services.set(id, serviceInstance);
    
    // Emit registration event
    this.emit(ServiceEvents.REGISTERED, serviceInstance);
    
    logger.info(`Service registered: ${service.name}`, {
      serviceId: id,
      serviceType: service.type
    });
    
    return serviceInstance;
  }
  
  /**
   * Register the current service
   * 
   * @param type Service type
   * @param metadata Service metadata
   * @returns The registered service instance
   */
  public registerCurrentService(type: ServiceType, metadata: Record<string, any> = {}): ServiceInstance {
    const host = config.HOST || 'localhost';
    const port = config.PORT || 3000;
    
    const serviceInstance = this.registerService({
      name: `${type}-${host}-${port}`,
      type,
      host,
      port,
      url: `http://${host}:${port}`,
      healthCheckUrl: `http://${host}:${port}/health`,
      status: ServiceStatus.UP,
      metadata: {
        ...metadata,
        version: config.APP_VERSION || '1.0.0',
        environment: config.NODE_ENV
      }
    });
    
    this.currentServiceId = serviceInstance.id;
    
    return serviceInstance;
  }
  
  /**
   * Deregister a service instance
   * 
   * @param id Service instance ID
   * @returns boolean indicating if service was deregistered
   */
  public deregisterService(id: string): boolean {
    const service = this.services.get(id);
    
    if (!service) {
      return false;
    }
    
    this.services.delete(id);
    
    // Emit deregistration event
    this.emit(ServiceEvents.DEREGISTERED, service);
    
    logger.info(`Service deregistered: ${service.name}`, {
      serviceId: id,
      serviceType: service.type
    });
    
    return true;
  }
  
  /**
   * Deregister the current service
   */
  public deregisterCurrentService(): void {
    if (this.currentServiceId) {
      this.deregisterService(this.currentServiceId);
      this.currentServiceId = null;
    }
  }
  
  /**
   * Update service status
   * 
   * @param id Service instance ID
   * @param status New service status
   * @returns The updated service instance or null if not found
   */
  public updateServiceStatus(id: string, status: ServiceStatus): ServiceInstance | null {
    const service = this.services.get(id);
    
    if (!service) {
      return null;
    }
    
    const previousStatus = service.status;
    service.status = status;
    
    // Emit status change event if status changed
    if (previousStatus !== status) {
      this.emit(ServiceEvents.STATUS_CHANGED, {
        service,
        previousStatus,
        newStatus: status
      });
      
      logger.info(`Service status changed: ${service.name}`, {
        serviceId: id,
        serviceType: service.type,
        previousStatus,
        newStatus: status
      });
    }
    
    return service;
  }
  
  /**
   * Update service heartbeat
   * 
   * @param id Service instance ID
   * @returns The updated service instance or null if not found
   */
  public updateHeartbeat(id: string): ServiceInstance | null {
    const service = this.services.get(id);
    
    if (!service) {
      return null;
    }
    
    service.lastHeartbeat = new Date();
    
    return service;
  }
  
  /**
   * Get all registered services
   * 
   * @returns Array of all registered service instances
   */
  public getAllServices(): ServiceInstance[] {
    return Array.from(this.services.values());
  }
  
  /**
   * Get all healthy services
   * 
   * @returns Array of healthy service instances
   */
  public getHealthyServices(): ServiceInstance[] {
    return this.getAllServices().filter(service => service.status === ServiceStatus.UP);
  }
  
  /**
   * Get services by type
   * 
   * @param type Service type
   * @param onlyHealthy Whether to return only healthy services
   * @returns Array of service instances of the specified type
   */
  public getServicesByType(type: ServiceType, onlyHealthy: boolean = true): ServiceInstance[] {
    const services = this.getAllServices().filter(service => service.type === type);
    
    if (onlyHealthy) {
      return services.filter(service => service.status === ServiceStatus.UP);
    }
    
    return services;
  }
  
  /**
   * Get service by ID
   * 
   * @param id Service instance ID
   * @returns Service instance or null if not found
   */
  public getServiceById(id: string): ServiceInstance | null {
    return this.services.get(id) || null;
  }
  
  /**
   * Get current service
   * 
   * @returns Current service instance or null if not registered
   */
  public getCurrentService(): ServiceInstance | null {
    if (!this.currentServiceId) {
      return null;
    }
    
    return this.getServiceById(this.currentServiceId);
  }
  
  /**
   * Discover a service instance
   * 
   * @param type Service type
   * @returns A healthy service instance or null if none found
   */
  public discoverService(type: ServiceType): ServiceInstance | null {
    const services = this.getServicesByType(type, true);
    
    if (services.length === 0) {
      return null;
    }
    
    // Simple round-robin load balancing
    const randomIndex = Math.floor(Math.random() * services.length);
    const service = services[randomIndex];
    
    // Emit discovery event
    this.emit(ServiceEvents.DISCOVERED, service);
    
    return service;
  }
  
  /**
   * Check health of a service instance
   * 
   * @param service Service instance to check
   */
  private async checkServiceHealth(service: ServiceInstance): Promise<void> {
    try {
      const response = await axios.get(service.healthCheckUrl, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.updateServiceStatus(service.id, ServiceStatus.UP);
      } else {
        this.updateServiceStatus(service.id, ServiceStatus.DOWN);
      }
    } catch (error) {
      this.updateServiceStatus(service.id, ServiceStatus.DOWN);
      
      logger.warn(`Health check failed for service: ${service.name}`, {
        serviceId: service.id,
        serviceType: service.type,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Start health check interval
   */
  private startHealthChecks(): void {
    // Clear existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Start new interval
    this.healthCheckInterval = setInterval(() => {
      const services = this.getAllServices();
      
      // Don't check the current service
      const externalServices = services.filter(service => 
        service.id !== this.currentServiceId
      );
      
      // Check health of each service
      for (const service of externalServices) {
        this.checkServiceHealth(service);
      }
      
      // Remove services that haven't sent a heartbeat in 30 seconds
      const now = new Date();
      const staleServices = services.filter(service => {
        const heartbeatAge = now.getTime() - service.lastHeartbeat.getTime();
        return heartbeatAge > 30000; // 30 seconds
      });
      
      for (const service of staleServices) {
        this.deregisterService(service.id);
      }
    }, 15000); // Every 15 seconds
  }
  
  /**
   * Start heartbeat interval for this service
   */
  private startHeartbeat(): void {
    // Clear existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Start new interval
    this.heartbeatInterval = setInterval(() => {
      if (this.currentServiceId) {
        this.updateHeartbeat(this.currentServiceId);
      }
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Clean up intervals on shutdown
   */
  public shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Deregister this service
    this.deregisterCurrentService();
    
    logger.info('Service registry shut down');
  }
}

// Create singleton instance
export const serviceRegistry = new ServiceRegistry();

// Handle process exit
process.on('exit', () => {
  serviceRegistry.shutdown();
});

process.on('SIGINT', () => {
  serviceRegistry.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  serviceRegistry.shutdown();
  process.exit(0);
});

export default serviceRegistry;
