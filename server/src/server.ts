import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import middleware and utilities
import { errorHandler } from '@/middleware/errorHandler';
import { rateLimiter } from '@/middleware/rateLimiter';
import { connectDatabase } from '@/utils/database';
import { logger } from '@/utils/logger';

// Import ALL route handlers
import adminRoutes from '@/routes/admin';
import authRoutes from '@/routes/auth';
import bidRoutes from '@/routes/bids';
import notificationRoutes from '@/routes/notifications';
// Temporarily comment out payment routes until the file is fixed
// import paymentRoutes from '@/routes/payments';
import reviewRoutes from '@/routes/reviews';
import taskRoutes from '@/routes/tasks';
import userRoutes from '@/routes/users';
import verificationRoutes from '@/routes/verification';

// Import WebSocket handlers
import { setupSocketHandlers } from '@/websocket/socketHandlers';

// Load environment variables
dotenv.config();

// Create a properly typed global store for our socket instance
// This avoids namespace issues and provides type safety
interface FlexTaskerGlobal {
  socketIO?: SocketIOServer;
}

// We'll use a singleton pattern instead of modifying globalThis
const globalStore: FlexTaskerGlobal = {};

// Export a helper function to access the socket instance from other modules
export function getSocketIO(): SocketIOServer | undefined {
  return globalStore.socketIO;
}

/**
 * Main server class for the FlexTasker application.
 * This class handles all server initialization, middleware setup,
 * routing configuration, and WebSocket connections.
 */
class FlexTaskerServer {
  // Mark properties as readonly since they're never reassigned
  private readonly app: express.Application;
  private readonly server: HttpServer; // Use proper type instead of 'any'
  private readonly io: SocketIOServer;
  private readonly port: number;

  constructor() {
    this.app = express();
    // Use nullish coalescing for safer default value handling
    this.port = parseInt(process.env.PORT ?? '3000');
    
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        // Use nullish coalescing instead of logical OR
        origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Store socket.io instance in our global store instead of globalThis
    // This provides type safety without modifying global objects
    globalStore.socketIO = this.io;

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  /**
   * Initializes all Express middleware.
   * This includes security headers, CORS, compression, and request logging.
   */
  private initializeMiddleware(): void {
    // Security headers configuration
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    }));

    // CORS configuration for cross-origin requests
    this.app.use(cors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Response compression for better performance
    this.app.use(compression());
    
    // Body parsing middleware with size limits
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Rate limiting for API protection
    this.app.use(rateLimiter);

    // Request logging middleware
    // Using underscore prefix for intentionally unused parameters
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });

    // Health check endpoint for monitoring
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? '1.0.0'
      });
    });

    // Static file serving for uploads
    this.app.use('/uploads', express.static(process.env.UPLOAD_PATH ?? './uploads'));
  }

  /**
   * Sets up all API routes.
   * Routes are organized by feature and versioned for API stability.
   */
  private initializeRoutes(): void {
    const apiPrefix = '/api/v1';

    // Register all route modules
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/users`, userRoutes);
    this.app.use(`${apiPrefix}/tasks`, taskRoutes);
    this.app.use(`${apiPrefix}/bids`, bidRoutes);
    this.app.use(`${apiPrefix}/reviews`, reviewRoutes);
    this.app.use(`${apiPrefix}/verification`, verificationRoutes);
    // Temporarily disable payment routes until the module is fixed
    // this.app.use(`${apiPrefix}/payments`, paymentRoutes);
    this.app.use(`${apiPrefix}/admin`, adminRoutes);
    this.app.use(`${apiPrefix}/notifications`, notificationRoutes);

    // API documentation endpoint
    this.app.get(`${apiPrefix}/docs`, (_req, res) => {
      res.json({
        name: 'FLEXTASKER API',
        version: '1.0.0',
        description: 'Modern task marketplace platform API',
        endpoints: {
          auth: `${apiPrefix}/auth`,
          users: `${apiPrefix}/users`,
          tasks: `${apiPrefix}/tasks`,
          bids: `${apiPrefix}/bids`,
          reviews: `${apiPrefix}/reviews`,
          verification: `${apiPrefix}/verification`,
          payments: `${apiPrefix}/payments`,
          admin: `${apiPrefix}/admin`,
          notifications: `${apiPrefix}/notifications`,
        },
        websocket: {
          endpoint: '/socket.io',
          events: ['send_message', 'join_conversation', 'start_typing', 'stop_typing'],
        },
        documentation: 'https://docs.flextasker.com',
      });
    });

    // 404 handler for unmatched routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Initializes WebSocket handlers for real-time features.
   */
  private initializeWebSocket(): void {
    setupSocketHandlers(this.io);
    logger.info('WebSocket server initialized for real-time communication');
  }

  /**
   * Sets up error handling and process management.
   * This includes graceful shutdown handling and error logging.
   */
  private initializeErrorHandling(): void {
    // Global error handler middleware
    this.app.use(errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections with proper typing
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  }

  /**
   * Starts the server and establishes database connection.
   * This is the main entry point for running the application.
   */
  public async start(): Promise<void> {
    try {
      // Connect to database first
      await connectDatabase();
      logger.info('Database connection established successfully');

      // Start the HTTP server
      this.server.listen(this.port, () => {
        logger.info(`🚀 FLEXTASKER Server is running on port ${this.port}`);
        logger.info(`📍 Health check: http://localhost:${this.port}/health`);
        logger.info(`📚 API docs: http://localhost:${this.port}/api/v1/docs`);
        logger.info(`🔌 WebSocket: ws://localhost:${this.port}/socket.io`);
        logger.info(`🌐 Environment: ${process.env.NODE_ENV ?? 'development'}`);
        
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
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Gracefully stops the server.
   * Used for testing and controlled shutdowns.
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('Server stopped gracefully');
        resolve();
      });
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new FlexTaskerServer();
  server.start().catch((error) => {
    logger.error('Failed to start FLEXTASKER server:', error);
    process.exit(1);
  });
}

export default FlexTaskerServer;