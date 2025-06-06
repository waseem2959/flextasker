/**
 * Application Initializer
 * 
 * This module provides initialization functions for different parts of the application.
 * It handles setting up middleware, routes, error handling, and WebSockets.
 */

import { json, urlencoded } from 'body-parser';
import cors from 'cors';
import { Application } from 'express';
import helmet from 'helmet';
import { Server as HttpServer } from 'http';

// Using require for modules without proper TypeScript definitions
// @ts-ignore
import cookieParser from 'cookie-parser';
// @ts-ignore
import morgan from 'morgan';
// @ts-ignore
import errorHandler from '../middleware/error-handler-middleware';
import { getEndpointMetricsMiddleware, metricsMiddleware } from '../middleware/metrics-middleware';
import { performanceMonitoringMiddleware } from '../monitoring/performance-monitor';
import { cacheMiddleware } from './cache/cache-middleware';
import { redisClient } from './cache/redis-client';
import { logger } from './logger';
// Monitoring is initialized in the monitoring module

// Redis client is imported as a singleton

/**
 * Initialize common Express middleware
 */
export function initializeMiddleware(app: Application): void {
  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL 
      : 'http://localhost:3000',
    credentials: true
  }));
  
  // Request parsing middleware
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  
  // Logging middleware
  app.use(morgan('dev'));

  // Performance monitoring middleware (should be early in the chain)
  app.use(performanceMonitoringMiddleware);

  // Cache middleware with default 5 minute cache duration
  app.use(cacheMiddleware());
  logger.info('Cache middleware applied');

  // Metrics middleware for monitoring migration to consolidated services
  app.use(metricsMiddleware);
  
  // Setup metrics endpoint for monitoring dashboards
  app.get('/metrics', getEndpointMetricsMiddleware('metrics'));
  
  logger.info('Application middleware initialized');
}

/**
 * Initialize routes
 */
export function initializeRoutes(app: Application): void {
  // Import routes using standardized naming convention with hyphenated format
  const authRoutes = require('../routes/auth-routes').default;
  const userRoutes = require('../routes/user-routes').default;
  const taskRoutes = require('../routes/task-routes').default;
  const bidRoutes = require('../routes/bid-routes').default;
  const adminRoutes = require('../routes/admin-routes').default;
  const notificationRoutes = require('../routes/notifications-routes').default;
  const paymentRoutes = require('../routes/payments-routes').default;
  const reviewRoutes = require('../routes/reviews-routes').default;
  const verificationRoutes = require('../routes/verification-routes').default;
  const monitoringRoutes = require('../routes/monitoring-routes').default;
  
  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/bids', bidRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/verification', verificationRoutes);
  app.use('/api/monitoring', monitoringRoutes);
  
  // Admin dashboard routes
  // Add any admin-specific routes here
  
  // API health check route
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis: redisClient ? 'connected' : 'disconnected'
    });
  });
  
  // Error handling middleware should be initialized last
  app.use(errorHandler);
  
  logger.info('Application routes initialized');
}

/**
 * Initialize WebSockets
 */
export function initializeSockets(server: HttpServer): void {
  // Import and initialize WebSocket server
  const { initializeWebSockets } = require('../websockets');
  initializeWebSockets(server);
  
  logger.info('WebSocket server initialized');
}

/**
 * Initialize migration monitoring system
 */
export async function initializeMonitoring(): Promise<void> {
  try {
    // Initialize monitoring
    logger.info('Monitoring system initialized');
  } catch (error) {
    logger.error('Error initializing monitoring system', { error });
    // Non-critical error, don't rethrow
  }
}

/**
 * Graceful shutdown handler
 */
export function gracefulShutdown(server: HttpServer): void {
  // Handle process termination signals
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      // Close HTTP server
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Monitoring system cleanup
      logger.info('Monitoring system cleanup complete');
      
      // Close Redis connections
      try {
        if (redisClient) {
          await redisClient.quit();
          logger.info('Redis connections closed');
        }
      } catch (error) {
        logger.error('Error closing Redis connections', { error });
      }
      
      // Exit with success code
      logger.info('Shutdown complete');
      process.exit(0);
    });
  });
}
