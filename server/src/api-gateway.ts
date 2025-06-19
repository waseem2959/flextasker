import * as express from 'express';
import { Application, NextFunction, Request, Response } from 'express';
import { rateLimiter } from './middleware/rate-limiter-middleware';
import * as requestContext from './middleware/request-context-middleware';
import { security } from './middleware/security-middleware';
import { config } from './utils/config';
import { errorHandlerMiddleware } from './utils/error-utils';
import { createI18nMiddleware, languageMiddleware } from './utils/i18n';
import { logger } from './utils/logger';

import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import helmet from 'helmet';
import { authenticateToken } from './middleware/auth-middleware';
import { apiDocHandler } from './utils/api-docs';
import * as healthMonitor from './utils/health-monitor';

export class ApiGateway {
  private readonly app: Application;
  
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupHealthRoutes();
    this.setupApiRoutes();
    this.setupErrorHandling();
  }
  
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
    this.app.use(requestContext.default);
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
  private setupHealthRoutes(): void {
    this.app.get('/health', healthMonitor.default.livenessProbeHandler);
    this.app.get('/health/ready', healthMonitor.default.readinessProbeHandler);
    this.app.get('/health/status', healthMonitor.default.healthCheckHandler);
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

    
    // Register API resource routes
    protectedRouter.use('/users', require('./routes/user-routes').default);
    protectedRouter.use('/tasks', require('./routes/task-routes').default);
    protectedRouter.use('/bids', require('./routes/bid-routes').default);
    protectedRouter.use('/notifications', require('./routes/notifications-routes').default);
    protectedRouter.use('/reviews', require('./routes/reviews-routes').default);
    // Note: categories, chat, files, and settings routes don't exist yet
    
    // Admin routes (require admin role)
    const adminRouter = express.Router();
    adminRouter.use(authenticateToken);
    // Admin role check middleware
    const adminCheckMiddleware = (req: Request, res: Response, next: NextFunction): void => {
      if ((req.user as any)?.role !== 'ADMIN') {
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
    
    adminRouter.use('/admin', require('./routes/admin-routes').default);
    
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
  private setupErrorHandling(): void {
    // Use the comprehensive error handling middleware
    this.app.use(errorHandlerMiddleware);
  }
  public getApp(): Application {
    return this.app;
  }
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
