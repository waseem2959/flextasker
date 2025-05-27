/**
 * Application Initializer
 * 
 * This module provides initialization functions for different parts of the application.
 * It handles setting up middleware, routes, error handling, and WebSockets.
 */

import { Application } from 'express';
import { Server as HttpServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { json, urlencoded } from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { initializeWebSockets } from './websocket';
import { errorHandler } from '../middleware/enhanced-error-handler';
import { cacheMiddleware } from './cache/cache-middleware';
import { logger } from './logger';
import { redisClient } from './cache/redis-client';

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
  
  // Cache middleware
  app.use(cacheMiddleware);
  
  logger.info('Application middleware initialized');
}

/**
 * Initialize routes
 */
export function initializeRoutes(app: Application): void {
  // Import routes dynamically to avoid circular dependencies
  const { authRoutes } = require('../routes/auth.routes');
  const { userRoutes } = require('../routes/user.routes');
  const { taskRoutes } = require('../routes/task.routes');
  const { bidRoutes } = require('../routes/bid.routes');
  const { reviewRoutes } = require('../routes/review.routes');
  const { categoryRoutes } = require('../routes/category.routes');
  const { notificationRoutes } = require('../routes/notification.routes');
  const { chatRoutes } = require('../routes/chat.routes');
  
  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/bids', bidRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/chat', chatRoutes);
  
  // API health check route
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis: redisClient.status
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
  initializeWebSockets(server);
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
      
      // Close Redis connections
      try {
        await redisClient.quit();
        logger.info('Redis connections closed');
      } catch (error) {
        logger.error('Error closing Redis connections', { error });
      }
      
      // Exit with success code
      logger.info('Shutdown complete');
      process.exit(0);
    });
  });
}
