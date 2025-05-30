/**
 * API Gateway
 * 
 * This module serves as the central entry point for all API requests.
 * It handles routing, authentication, and provides consistent request processing.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { createI18nMiddleware, languageMiddleware } from './utils/i18n';
import { rateLimiter } from './middleware/rate-limiter-middleware';
import requestContext from './middleware/request-context-middleware';
import { security } from './middleware/security-middleware';
import { errorHandler } from './middleware/error-handler-middleware';
import { cacheMiddleware } from './utils/cache/cache-middleware';
import healthMonitor from './utils/health-monitor';
import { apiDocHandler } from './utils/api-docs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { authenticateToken } from './middleware/auth-middleware';

export class ApiGateway {
  private readonly app: Application;
  
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupHealthRoutes();
    this.setupApiRoutes();
    this.setupErrorHandling();
  }
  
  /**
   * Set up standard middleware
   */
  private setupMiddleware(): void {
    // Parse JSON and URL-encoded bodies
    this.app.use(express.json({ limit: '2mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '2mb' }));
    
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
    }));
    this.app.use(cookieParser());
    this.app.use(security.securityHeaders);
    
    // Request processing
    this.app.use(compression());
    this.app.use(requestContext);
    this.app.use(rateLimiter);
    
    // Internationalization
    this.app.use(createI18nMiddleware());
    this.app.use(languageMiddleware);
    
    // Logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.info(`API Request: ${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip
      });
      next();
    });
  }
  
  /**
   * Set up health check routes
   */
  private setupHealthRoutes(): void {
    this.app.get('/health', healthMonitor.livenessProbeHandler);
    this.app.get('/health/ready', healthMonitor.readinessProbeHandler);
    this.app.get('/health/status', healthMonitor.healthCheckHandler);
  }
  
  /**
   * Set up API routes
   */
  private setupApiRoutes(): void {
    const apiRouter = express.Router();
    
    // API Documentation
    apiRouter.use('/docs', apiDocHandler);
    
    // Authentication routes (no auth required)
    apiRouter.use('/auth', require('./routes/auth').default);
    
    // Protected routes (require authentication)
    const protectedRouter = express.Router();
    protectedRouter.use(authenticateToken);
    
    // Apply caching middleware to GET requests
    protectedRouter.get('*', cacheMiddleware());
    
    // Register API resource routes
    protectedRouter.use('/users', require('./routes/users').default);
    protectedRouter.use('/tasks', require('./routes/tasks').default);
    protectedRouter.use('/categories', require('./routes/categories').default);
    protectedRouter.use('/bids', require('./routes/bids').default);
    protectedRouter.use('/chat', require('./routes/chat').default);
    protectedRouter.use('/notifications', require('./routes/notifications').default);
    protectedRouter.use('/reviews', require('./routes/reviews').default);
    protectedRouter.use('/files', require('./routes/files').default);
    protectedRouter.use('/settings', require('./routes/settings').default);
    
    // Admin routes (require admin role)
    const adminRouter = express.Router();
    adminRouter.use(authenticateToken);
    // Admin role check middleware
    const adminCheckMiddleware = (req: Request, res: Response, next: NextFunction): void => {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            type: 'AUTHORIZATION',
            message: 'Admin access required'
          }
        });
      } else {
        next();
      }
    };
    
    adminRouter.use(adminCheckMiddleware);
    
    adminRouter.use('/admin', require('./routes/admin').default);
    
    // Register the routers
    apiRouter.use(protectedRouter);
    apiRouter.use(adminRouter);
    
    // Mount the API router at /api
    this.app.use('/api', apiRouter);
    
    // Handle 404 for API routes
    this.app.use('/api/*', (_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'API endpoint not found'
        }
      });
    });
    
    // For all other routes, return a 404 error
    this.app.use('*', (_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Resource not found'
        }
      });
    });
  }
  
  /**
   * Set up error handling
   */
  private setupErrorHandling(): void {
    // Central error handling middleware - must be registered last
    const errorMiddleware = (
      err: any,
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      if (res.headersSent) {
        return next(err);
      }
      
      // Convert to Error instance if needed
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Delegate to the error handler function
      errorHandler(error, req, res, next);
    };
    
    // Register the error handling middleware
    this.app.use(errorMiddleware as express.ErrorRequestHandler);
  }
  
  /**
   * Get the Express application
   */
  public getApp(): Application {
    return this.app;
  }
  
  /**
   * Start the API gateway
   */
  public start(): void {
    const port = config.PORT || 3000;
    
    this.app.listen(port, () => {
      logger.info(`API Gateway started on port ${port}`, {
        port,
        environment: config.NODE_ENV,
        clientUrl: config.CLIENT_URL
      });
    });
  }
}

export default new ApiGateway();
