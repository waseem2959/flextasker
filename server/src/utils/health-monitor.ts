/**
 * Health Monitoring System
 * 
 * This module provides utilities for monitoring the health and status of
 * various application components and dependencies.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import os from 'os';
import { redisClient } from './cache/redis-client';
import { logger } from './logger';
import { config } from './config';

// Initialize Prisma client
const prisma = new PrismaClient();

// Health status types
export enum HealthStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  DEGRADED = 'DEGRADED',
  UNKNOWN = 'UNKNOWN'
}

// Component types
export enum ComponentType {
  DATABASE = 'database',
  CACHE = 'cache',
  FILE_SYSTEM = 'file_system',
  EXTERNAL_API = 'external_api',
  QUEUE = 'queue',
  SYSTEM = 'system'
}

// Health check result interface
export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  version: string;
  environment: string;
  components: Record<string, {
    status: HealthStatus;
    type: ComponentType;
    message?: string;
    responseTime?: number;
    details?: Record<string, any>;
  }>;
  system?: {
    uptime: number;
    memory: {
      total: number;
      free: number;
      used: number;
      usedPercent: number;
    };
    cpu: {
      loadAvg: number[];
      cores: number;
    };
  };
}

/**
 * Perform a database health check
 */
async function checkDatabaseHealth(): Promise<{
  status: HealthStatus;
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}> {
  const startTime = Date.now();
  try {
    // Execute a simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: HealthStatus.UP,
      responseTime,
      message: 'Database connection successful'
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Database health check failed', { error });
    
    return {
      status: HealthStatus.DOWN,
      responseTime,
      message: 'Database connection failed',
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Perform a Redis cache health check
 */
async function checkCacheHealth(): Promise<{
  status: HealthStatus;
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}> {
  const startTime = Date.now();
  try {
    // Check if Redis is connected
    if (!redisClient.isReady) {
      return {
        status: HealthStatus.DOWN,
        responseTime: Date.now() - startTime,
        message: 'Redis client not ready'
      };
    }
    
    // Execute a simple ping command
    await redisClient.ping();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: HealthStatus.UP,
      responseTime,
      message: 'Redis connection successful'
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Redis health check failed', { error });
    
    return {
      status: HealthStatus.DOWN,
      responseTime,
      message: 'Redis connection failed',
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Perform a file system health check
 */
async function checkFileSystemHealth(): Promise<{
  status: HealthStatus;
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}> {
  const startTime = Date.now();
  try {
    // Get system information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usedPercent = (usedMemory / totalMemory) * 100;
    
    // Check if disk space is critically low (less than 10% free)
    const isDiskSpaceCritical = usedPercent > 90;
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: isDiskSpaceCritical ? HealthStatus.DEGRADED : HealthStatus.UP,
      responseTime,
      message: isDiskSpaceCritical 
        ? 'File system space is critically low'
        : 'File system check successful',
      details: {
        totalSpace: totalMemory,
        freeSpace: freeMemory,
        usedSpace: usedMemory,
        usedPercent: usedPercent.toFixed(2) + '%'
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('File system health check failed', { error });
    
    return {
      status: HealthStatus.UNKNOWN,
      responseTime,
      message: 'File system check failed',
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Check system resource health
 */
function checkSystemHealth(): {
  status: HealthStatus;
  details: {
    uptime: number;
    memory: {
      total: number;
      free: number;
      used: number;
      usedPercent: number;
    };
    cpu: {
      loadAvg: number[];
      cores: number;
    };
  };
} {
  try {
    // Get system information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usedPercent = (usedMemory / totalMemory) * 100;
    const loadAvg = os.loadavg();
    const cpuCores = os.cpus().length;
    
    // Check CPU load
    const averageLoad = loadAvg[0] / cpuCores;
    const isHighLoad = averageLoad > 0.8; // 80% threshold
    
    // Check memory usage
    const isHighMemory = usedPercent > 85; // 85% threshold
    
    let status = HealthStatus.UP;
    
    if (isHighLoad && isHighMemory) {
      status = HealthStatus.DEGRADED;
    } else if (isHighLoad || isHighMemory) {
      status = HealthStatus.DEGRADED;
    }
    
    return {
      status,
      details: {
        uptime: os.uptime(),
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usedPercent
        },
        cpu: {
          loadAvg,
          cores: cpuCores
        }
      }
    };
  } catch (error) {
    logger.error('System health check failed', { error });
    
    return {
      status: HealthStatus.UNKNOWN,
      details: {
        uptime: os.uptime(),
        memory: {
          total: 0,
          free: 0,
          used: 0,
          usedPercent: 0
        },
        cpu: {
          loadAvg: [0, 0, 0],
          cores: 0
        }
      }
    };
  }
}

/**
 * Perform a health check on all components
 */
export async function performHealthCheck(detailed: boolean = false): Promise<HealthCheckResult> {
  try {
    // Execute checks in parallel
    const [
      databaseHealth,
      cacheHealth,
      fileSystemHealth,
      systemHealth
    ] = await Promise.all([
      checkDatabaseHealth(),
      checkCacheHealth(),
      checkFileSystemHealth(),
      Promise.resolve(checkSystemHealth())
    ]);
    
    // Determine overall status - if any critical component is down, system is down
    let overallStatus = HealthStatus.UP;
    
    if (databaseHealth.status === HealthStatus.DOWN) {
      overallStatus = HealthStatus.DOWN;
    } else if (
      cacheHealth.status === HealthStatus.DOWN ||
      fileSystemHealth.status === HealthStatus.DEGRADED ||
      systemHealth.status === HealthStatus.DEGRADED
    ) {
      overallStatus = HealthStatus.DEGRADED;
    }
    
    // Build the health check result
    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: config.APP_VERSION || '1.0.0',
      environment: config.NODE_ENV,
      components: {
        database: {
          status: databaseHealth.status,
          type: ComponentType.DATABASE,
          responseTime: databaseHealth.responseTime,
          message: databaseHealth.message
        },
        cache: {
          status: cacheHealth.status,
          type: ComponentType.CACHE,
          responseTime: cacheHealth.responseTime,
          message: cacheHealth.message
        },
        fileSystem: {
          status: fileSystemHealth.status,
          type: ComponentType.FILE_SYSTEM,
          responseTime: fileSystemHealth.responseTime,
          message: fileSystemHealth.message
        },
        system: {
          status: systemHealth.status,
          type: ComponentType.SYSTEM
        }
      }
    };
    
    // Add detailed information if requested
    if (detailed) {
      if (databaseHealth.details) {
        result.components.database.details = databaseHealth.details;
      }
      
      if (cacheHealth.details) {
        result.components.cache.details = cacheHealth.details;
      }
      
      if (fileSystemHealth.details) {
        result.components.fileSystem.details = fileSystemHealth.details;
      }
      
      result.system = {
        uptime: systemHealth.details.uptime,
        memory: systemHealth.details.memory,
        cpu: systemHealth.details.cpu
      };
    }
    
    return result;
  } catch (error) {
    logger.error('Health check failed', { error });
    
    // Return a degraded status if the health check itself fails
    return {
      status: HealthStatus.DEGRADED,
      timestamp: new Date().toISOString(),
      version: config.APP_VERSION || '1.0.0',
      environment: config.NODE_ENV,
      components: {
        system: {
          status: HealthStatus.DEGRADED,
          type: ComponentType.SYSTEM,
          message: 'Health check failed'
        }
      }
    };
  }
}

/**
 * Health check endpoint handler
 */
export async function healthCheckHandler(req: Request, res: Response): Promise<void> {
  try {
    const detailed = req.query.detailed === 'true';
    const result = await performHealthCheck(detailed);
    
    // If the system is down, return a 503 status
    const statusCode = result.status === HealthStatus.DOWN ? 503 : 200;
    
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Health check handler failed', { error });
    
    res.status(500).json({
      status: HealthStatus.DOWN,
      timestamp: new Date().toISOString(),
      message: 'Health check failed'
    });
  }
}

/**
 * Simple liveness probe handler
 * Just returns 200 OK if the server is running
 */
export function livenessProbeHandler(_req: Request, res: Response): void {
  res.status(200).json({
    status: HealthStatus.UP,
    timestamp: new Date().toISOString()
  });
}

/**
 * Readiness probe handler
 * Checks if the application is ready to handle requests
 */
export async function readinessProbeHandler(_req: Request, res: Response): Promise<void> {
  try {
    // Only check critical components for readiness
    const [databaseHealth, cacheHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkCacheHealth()
    ]);
    
    const isReady = databaseHealth.status === HealthStatus.UP && 
                   cacheHealth.status === HealthStatus.UP;
    
    if (isReady) {
      res.status(200).json({
        status: HealthStatus.UP,
        timestamp: new Date().toISOString(),
        message: 'Application is ready'
      });
    } else {
      res.status(503).json({
        status: HealthStatus.DOWN,
        timestamp: new Date().toISOString(),
        message: 'Application is not ready',
        details: {
          database: databaseHealth.status,
          cache: cacheHealth.status
        }
      });
    }
  } catch (error) {
    logger.error('Readiness probe failed', { error });
    
    res.status(500).json({
      status: HealthStatus.DOWN,
      timestamp: new Date().toISOString(),
      message: 'Readiness check failed'
    });
  }
}

export default {
  performHealthCheck,
  healthCheckHandler,
  livenessProbeHandler,
  readinessProbeHandler,
  HealthStatus,
  ComponentType
};
