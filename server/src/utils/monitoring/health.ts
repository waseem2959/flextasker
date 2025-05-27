/**
 * Health Monitoring Utility
 * 
 * This module provides health check functionality to monitor the application
 * and its dependencies (database, external services, etc.).
 */

import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { logger } from '../logger';
import os from 'os';

// Initialize Prisma client for database checks
const prisma = new PrismaClient();

// Track application start time for uptime calculation
const startTime = Date.now();

// Health status enum
export enum HealthStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  DEGRADED = 'DEGRADED'
}

// Health check result interface
export interface HealthCheckResult {
  status: HealthStatus;
  uptime: number;
  timestamp: string;
  version: string;
  components: {
    [key: string]: {
      status: HealthStatus;
      details?: any;
    };
  };
  systemInfo: {
    cpuUsage: number;
    memoryUsage: {
      total: number;
      free: number;
      usedPercentage: number;
    };
    platform: string;
    hostname: string;
  };
}

/**
 * Performs a health check on the application and its dependencies
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  // Initialize health status as UP
  let overallStatus = HealthStatus.UP;
  
  // Check components
  const components: HealthCheckResult['components'] = {};
  
  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    components.database = { status: HealthStatus.UP };
  } catch (error) {
    logger.error('Database health check failed', { error });
    components.database = { 
      status: HealthStatus.DOWN,
      details: { message: 'Database connection failed', error: error.message }
    };
    overallStatus = HealthStatus.DOWN;
  }
  
  // Check file system
  try {
    const fs = require('fs');
    fs.accessSync(process.cwd(), fs.constants.R_OK | fs.constants.W_OK);
    components.fileSystem = { status: HealthStatus.UP };
  } catch (error) {
    logger.error('File system health check failed', { error });
    components.fileSystem = {
      status: HealthStatus.DOWN,
      details: { message: 'File system access failed', error: error.message }
    };
    overallStatus = HealthStatus.DOWN;
  }
  
  // System information
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedPercentage = Math.round((1 - freeMemory / totalMemory) * 100);
  
  // Get CPU usage
  const cpuUsage = os.loadavg()[0]; // 1-minute load average
  
  // Memory usage warning threshold (80%)
  if (usedPercentage > 80) {
    logger.warn('High memory usage detected', { usedPercentage });
    
    // Set status to DEGRADED if memory usage is high
    if (overallStatus === HealthStatus.UP) {
      overallStatus = HealthStatus.DEGRADED;
    }
    
    components.memory = {
      status: HealthStatus.DEGRADED,
      details: { usedPercentage }
    };
  } else {
    components.memory = { status: HealthStatus.UP };
  }
  
  // CPU usage warning threshold (70%)
  const cpuCount = os.cpus().length;
  const normalizedCpuUsage = (cpuUsage / cpuCount) * 100;
  if (normalizedCpuUsage > 70) {
    logger.warn('High CPU usage detected', { normalizedCpuUsage });
    
    // Set status to DEGRADED if CPU usage is high
    if (overallStatus === HealthStatus.UP) {
      overallStatus = HealthStatus.DEGRADED;
    }
    
    components.cpu = {
      status: HealthStatus.DEGRADED,
      details: { normalizedCpuUsage }
    };
  } else {
    components.cpu = { status: HealthStatus.UP };
  }
  
  // Calculate uptime in seconds
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  // Create health check result
  const result: HealthCheckResult = {
    status: overallStatus,
    uptime,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    components,
    systemInfo: {
      cpuUsage: normalizedCpuUsage,
      memoryUsage: {
        total: Math.round(totalMemory / (1024 * 1024)), // MB
        free: Math.round(freeMemory / (1024 * 1024)), // MB
        usedPercentage
      },
      platform: os.platform(),
      hostname: os.hostname()
    }
  };
  
  return result;
}

/**
 * Express route handler for health check endpoint
 */
export async function healthCheckHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await performHealthCheck();
    
    // Set appropriate status code based on health status
    let statusCode = 200;
    if (result.status === HealthStatus.DEGRADED) {
      statusCode = 200; // Still available but with degraded performance
    } else if (result.status === HealthStatus.DOWN) {
      statusCode = 503; // Service unavailable
    }
    
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      status: HealthStatus.DOWN,
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
}

/**
 * Simple readiness probe that just checks if the application is running
 */
export function readinessProbeHandler(req: Request, res: Response): void {
  res.status(200).json({
    status: HealthStatus.UP,
    timestamp: new Date().toISOString()
  });
}

/**
 * Schedule periodic health checks
 * @param intervalMs Interval in milliseconds (default: 5 minutes)
 */
export function scheduleHealthChecks(intervalMs: number = 5 * 60 * 1000): void {
  setInterval(async () => {
    try {
      const result = await performHealthCheck();
      
      // Log health check results
      if (result.status !== HealthStatus.UP) {
        logger.warn('Health check detected issues', { result });
      } else {
        logger.debug('Health check passed', { result });
      }
    } catch (error) {
      logger.error('Scheduled health check failed', { error });
    }
  }, intervalMs);
  
  logger.info(`Scheduled health checks at ${intervalMs}ms intervals`);
}
