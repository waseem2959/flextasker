import dotenv from 'dotenv';
import express from 'express';
import { createServer, Server as HttpServer } from 'http';

// Import middleware and utilities
import { ApiGateway } from './api-gateway';
import performanceProfiler from './middleware/performance-profiler-middleware';
import {
  initializeMiddleware,
  initializeMonitoring,
  initializeRoutes,
  initializeSockets,
  gracefulShutdown
} from './utils/app-initializer';
import { config } from './utils/config';
import { initializeMigrationSystem } from './utils/db-migration';
import featureFlagsService from './utils/feature-flags';
import { HealthStatus, performHealthCheck } from './utils/health-monitor';
import { initializeI18n } from './utils/i18n';

import { logger } from './utils/logger';
import { initializeOAuthProviders } from './utils/oauth-providers';
import { initializeScheduledTasks } from './utils/scheduled-tasks';
import { serviceRegistry, ServiceType } from './utils/service-registry';
import validationUtils from './utils/validation-utils';

// Load environment variables
dotenv.config();

/**
 * Main server class for the FlexTasker application.
 * This class handles all server initialization, middleware setup,
 * routing configuration, and WebSocket connections.
 */
class FlexTaskerServer {
  private readonly app: express.Application;
  private readonly server: HttpServer;
  private readonly port: number;

  constructor() {
    const apiGateway = new ApiGateway();
    this.app = apiGateway.getApp();
    this.port = config.PORT || 3000;
    this.server = createServer(this.app);
    
    // Initialize all components
    this.initializeApp();
    this.handleProcessEvents();
  }

  /**
   * Initialize all application components
   */
  private initializeApp(): void {
    // Setup Express middleware (security, parsing, etc.)
    initializeMiddleware(this.app);
    
    // Setup API routes
    initializeRoutes(this.app);
    
    // Setup WebSockets
    initializeSockets(this.server);
    
    // Setup graceful shutdown
    gracefulShutdown(this.server);
  }

  /**
   * Handle process events for better error management
   */
  private handleProcessEvents(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  /**
   * Start the server and establish database connection
   */
  public async start(): Promise<void> {
    try {
      // Initialize configuration
      logger.info('Initializing application components...');
      
      // Connect to database and initialize migrations
      await initializeMigrationSystem();
      logger.info('Database connection and migrations initialized');
      
      // Initialize monitoring system
      await initializeMonitoring();
      logger.info('Monitoring system initialized');
      
      // Note: CacheService is already initialized and doesn't need an explicit initialize call
      logger.info('Cache service ready');
      
      // Initialize internationalization
      await initializeI18n();
      logger.info('Internationalization system initialized');
      
      // Initialize validation schemas
      validationUtils.initializeValidation();
      logger.info('Validation system initialized');
      
      // Initialize performance monitoring
      performanceProfiler.initializePerformanceMonitoring();
      logger.info('Performance monitoring initialized');
      
      // Initialize feature flags
      await featureFlagsService.initializeFeatureFlags();
      logger.info('Feature flags initialized');
      
      // Initialize OAuth providers
      initializeOAuthProviders();
      logger.info('OAuth providers initialized');
      
      // Initialize scheduled tasks
      await initializeScheduledTasks();
      logger.info('Scheduled tasks initialized');
      
      // Perform initial health check
      const healthStatus = await performHealthCheck(true);
      if (healthStatus.status === HealthStatus.DOWN) {
        throw new Error('System health check failed, cannot start server');
      }
      logger.info('Initial health check passed', { status: healthStatus.status });
      
      // Register this service in the service registry
      serviceRegistry.registerCurrentService(ServiceType.API_GATEWAY, {
        startTime: new Date(),
        features: await performHealthCheck()
      });
      logger.info('Service registered in service registry');
      
      // Start HTTP server
      this.server.listen(this.port, () => {
        logger.info(`Server running on port ${this.port}`);
        logger.info(`API docs available at http://localhost:${this.port}/api-docs`);
        logger.info(`Health check available at http://localhost:${this.port}/health`);
        logger.info(`🌐 Environment: ${config.NODE_ENV}`);
        
        // Visual confirmation of all systems
        console.log('\n🎉 FLEXTASKER Platform Ready!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Authentication System');
        console.log('✅ User Management');
        console.log('✅ Task & Bid Management');
        console.log('✅ Review System');
        console.log('✅ Payment Processing');
        console.log('✅ Email & SMS Services');
        console.log('✅ Verification Systems');
        console.log('✅ Real-time Messaging');
        console.log('✅ Admin Dashboard');
        console.log('✅ Notification System');
        console.log('✅ Internationalization (i18n)');
        console.log('✅ Feature Flags');
        console.log('✅ Audit Trail System');
        console.log('✅ Health Monitoring');
        console.log('✅ OAuth Authentication');
        console.log('✅ Scheduled Tasks');
        console.log('✅ API Versioning');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new FlexTaskerServer();
  server.start().catch((error) => {
    logger.error('Error starting server:', error);
    process.exit(1);
  });
}

export default FlexTaskerServer;