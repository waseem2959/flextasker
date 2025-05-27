# Flextasker Architecture Guidelines

## Overview

Flextasker is a modern web application built with React (TypeScript) on the frontend and Node.js (Express, TypeScript) on the backend. It follows a modular architecture designed for scalability, maintainability, and performance.

## Project Structure

### Frontend Structure
```
src/
├── components/     # Reusable UI components
│   ├── ui/         # Base UI components
│   ├── layout/     # Layout components
│   └── feature/    # Feature-specific components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── pages/          # Page components (routes)
├── services/       # External service integrations
│   ├── api/        # API client services
│   ├── websocket/  # WebSocket client (socket.io)
│   └── analytics/  # Analytics services
├── types/          # TypeScript type definitions
│   └── enums.ts    # Centralized enums
├── utils/          # Utility functions
└── stores/         # State management (if applicable)
```

### Backend Structure
```
server/
├── prisma/         # Prisma schema and migrations
├── src/
│   ├── api-gateway/    # API Gateway for request routing
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   │   ├── auth/           # Authentication middleware
│   │   ├── cache/          # Cache middleware
│   │   ├── request-context/# Request context tracking
│   │   └── performance-profiler/ # Performance monitoring
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic
│   │   ├── user-service.ts   # User management
│   │   ├── bid-service.ts    # Bid operations
│   │   ├── task-service.ts   # Task operations
│   │   └── notification-service.ts # Notification handling
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   │   ├── audit-trail/    # Audit logging system
│   │   ├── cache/          # Caching utilities
│   │   ├── config.ts       # Configuration management
│   │   ├── db-transaction.ts # Transaction handling
│   │   ├── error-types.ts  # Error classification
│   │   ├── feature-flags.ts # Feature toggling
│   │   ├── logger.ts       # Logging system
│   │   ├── monitoring.ts   # Error tracking
│   │   ├── pagination.ts   # Pagination utilities
│   │   ├── service-registry.ts # Service discovery
│   │   └── validation-utils.ts # Data validation
│   └── websockets/     # WebSocket handlers
└── tests/              # Backend tests
```

### Shared Code
```
shared/
└── types/          # Shared type definitions
    ├── api.ts      # API interface types
    ├── enums.ts    # Shared enums
    └── errors.ts   # Error types
```

## Architectural Components

### Core Components

#### API Gateway
Centralized entry point for all API requests that handles routing, middleware application, and provides a consistent interface for clients.

#### Service Registry
Manages service discovery and registration for microservices architecture, tracking service health and metadata.

#### Audit Trail System
Records data changes for compliance and accountability, providing a complete history of all significant system actions.

#### Performance Profiling
Measures and records performance metrics for key operations like database queries, external API calls, and cache operations.

#### Validation System
Centralized validation using Zod schemas to ensure data consistency and integrity across the application.

#### Feature Flags
Enables controlled feature rollouts, A/B testing, and environment-specific feature activation.

#### Cache Service
Improves performance by caching frequently accessed data with configurable TTLs and automatic invalidation.

#### Error Handling
Standardized error types, capturing, and reporting for improved debugging and monitoring.

### Service Initialization Flow

1. **Database Connection**: Establish database connection first
2. **Migration System**: Initialize database migration system
3. **Cache Service**: Initialize caching layer
4. **Internationalization**: Set up localization support
5. **Validation**: Register validation schemas
6. **Performance Monitoring**: Set up performance tracking
7. **Feature Flags**: Load feature flags configuration
8. **OAuth Providers**: Initialize external authentication providers
9. **Scheduled Tasks**: Set up recurring background jobs
10. **Health Check**: Perform initial system health verification
11. **Service Registry**: Register the service in the registry
12. **HTTP Server**: Start the web server

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Avoid using `any` type
- Use interfaces for object shapes
- Use enums for predefined values

### React
- Use functional components with hooks
- Implement proper component memoization for performance
- Extract reusable logic to custom hooks
- Follow modern React patterns (omit React import for JSX files)

### API Design
- Use REST principles for API endpoints
- Implement consistent error handling
- Use proper HTTP status codes
- Document API endpoints with OpenAPI/Swagger

### WebSocket Standards
- Use socket.io for WebSocket implementation
- Follow event-based architecture
- Implement room-based subscriptions
- Handle reconnection gracefully

### Error Handling
- Use centralized error types
- Implement consistent error responses
- Log errors with proper context
- Handle errors at appropriate levels

## Testing Guidelines
- Write unit tests for utility functions
- Write integration tests for API endpoints
- Implement end-to-end tests for critical flows
- Mock external dependencies

## Security Standards
- Implement proper authentication and authorization
- Use CSRF protection
- Set security headers
- Sanitize user input
- Implement rate limiting

## Performance Guidelines
- Implement caching where appropriate
- Optimize database queries
- Use proper indexing
- Implement connection pooling
