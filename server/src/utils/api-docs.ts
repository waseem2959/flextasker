/**
 * API Documentation Generator
 * 
 * This module provides utilities for generating API documentation from route definitions.
 * It uses OpenAPI/Swagger specification to document endpoints, parameters, and responses.
 */

import { Router } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import fs from 'fs/promises';
import { logger } from './logger';
import { config } from './config';

// Base OpenAPI document
const baseDocument: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'FlexTasker API',
    description: 'API for the FlexTasker platform, a modern freelance task marketplace.',
    version: '1.0.0',
    contact: {
      name: 'FlexTasker Support',
      email: 'support@flextasker.com',
      url: 'https://flextasker.com/support'
    },
    license: {
      name: 'Proprietary',
      url: 'https://flextasker.com/terms'
    }
  },
  servers: [
    {
      url: config.BASE_URL,
      description: config.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
    }
  ],
  paths: {},
  components: {
    schemas: {},
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['success', 'error'],
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                error: {
                  type: 'object',
                  required: ['type', 'message'],
                  properties: {
                    type: {
                      type: 'string',
                      example: 'AUTHENTICATION'
                    },
                    message: {
                      type: 'string',
                      example: 'Authentication required'
                    }
                  }
                }
              }
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error in request parameters or body',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['success', 'error'],
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                error: {
                  type: 'object',
                  required: ['type', 'message', 'details'],
                  properties: {
                    type: {
                      type: 'string',
                      example: 'VALIDATION'
                    },
                    message: {
                      type: 'string',
                      example: 'Validation failed'
                    },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['field', 'message'],
                        properties: {
                          field: {
                            type: 'string',
                            example: 'email'
                          },
                          message: {
                            type: 'string',
                            example: 'Must be a valid email address'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    { name: 'Auth', description: 'Authentication operations' },
    { name: 'Users', description: 'User operations' },
    { name: 'Tasks', description: 'Task operations' },
    { name: 'Bids', description: 'Bid operations' },
    { name: 'Reviews', description: 'Review operations' },
    { name: 'Chat', description: 'Chat operations' },
    { name: 'Notifications', description: 'Notification operations' }
  ],
  security: [
    { bearerAuth: [] }
  ]
};

/**
 * Route documentation metadata
 */
export interface RouteDoc {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  summary: string;
  description?: string;
  tags: string[];
  security?: boolean;
  requestBody?: {
    description: string;
    required: boolean;
    content: Record<string, any>;
  };
  parameters?: OpenAPIV3.ParameterObject[];
  responses: Record<string, OpenAPIV3.ResponseObject>;
}

/**
 * Register route documentation
 */
export function registerRouteDoc(doc: RouteDoc): void {
  baseDocument.paths[doc.path] ??= {};
  
  const pathItem = baseDocument.paths[doc.path] as OpenAPIV3.PathItemObject;
  
  // Add route method documentation
  pathItem[doc.method] = {
    summary: doc.summary,
    description: doc.description,
    tags: doc.tags,
    security: doc.security === false ? [] : undefined,
    requestBody: doc.requestBody,
    parameters: doc.parameters,
    responses: doc.responses
  };
}

/**
 * Register a schema in the components section
 */
export function registerSchema(name: string, schema: OpenAPIV3.SchemaObject): void {
  baseDocument.components ??= {};
  
  baseDocument.components.schemas ??= {};
  
  baseDocument.components.schemas[name] = schema;
}

/**
 * Generate OpenAPI document
 */
export function generateOpenApiDocument(): OpenAPIV3.Document {
  return { ...baseDocument };
}

/**
 * Save OpenAPI document to file
 */
export async function saveOpenApiDocument(filePath: string = './openapi.json'): Promise<void> {
  try {
    const document = generateOpenApiDocument();
    await fs.writeFile(filePath, JSON.stringify(document, null, 2));
    logger.info(`OpenAPI document saved to ${filePath}`);
  } catch (error) {
    logger.error('Failed to save OpenAPI document', { error, filePath });
    throw error;
  }
}

/**
 * Create Swagger UI middleware
 */
export function createSwaggerMiddleware(router: Router): void {
  // Import swaggerUi dynamically to avoid issues with SSR environments
  try {
    const swaggerUi = require('swagger-ui-express');
    
    router.use('/api-docs', swaggerUi.serve);
    router.get('/api-docs', swaggerUi.setup(generateOpenApiDocument(), {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'FlexTasker API Documentation',
      customfavIcon: '/favicon.ico'
    }));
    
    logger.info('Swagger UI middleware initialized at /api-docs');
  } catch (error) {
    logger.error('Failed to initialize Swagger UI middleware', { error });
  }
}

/**
 * Common schema definitions
 */
export const schemas = {
  // User schemas
  User: {
    type: 'object',
    required: ['id', 'email', 'firstName', 'lastName', 'role'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      role: { type: 'string', enum: ['USER', 'TASKER', 'ADMIN'] },
      avatar: { type: 'string', nullable: true },
      bio: { type: 'string', nullable: true },
      averageRating: { type: 'number', format: 'float' },
      emailVerified: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  
  // Task schemas
  Task: {
    type: 'object',
    required: ['id', 'title', 'description', 'status', 'budget', 'ownerId'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      description: { type: 'string' },
      status: { 
        type: 'string', 
        enum: ['DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] 
      },
      budget: { type: 'number' },
      categoryId: { type: 'string' },
      ownerId: { type: 'string', format: 'uuid' },
      assigneeId: { type: 'string', format: 'uuid', nullable: true },
      dueDate: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  
  // Bid schemas
  Bid: {
    type: 'object',
    required: ['id', 'taskId', 'bidderId', 'amount', 'status'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      taskId: { type: 'string', format: 'uuid' },
      bidderId: { type: 'string', format: 'uuid' },
      amount: { type: 'number' },
      message: { type: 'string', nullable: true },
      status: { 
        type: 'string', 
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'] 
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  
  // Review schemas
  Review: {
    type: 'object',
    required: ['id', 'userId', 'reviewerId', 'taskId', 'rating'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      reviewerId: { type: 'string', format: 'uuid' },
      taskId: { type: 'string', format: 'uuid' },
      rating: { type: 'integer', minimum: 1, maximum: 5 },
      comment: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  
  // Error schemas
  Error: {
    type: 'object',
    required: ['success', 'error'],
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        required: ['type', 'message'],
        properties: {
          type: { type: 'string' },
          message: { type: 'string' },
          details: { 
            type: 'object',
            additionalProperties: true
          }
        }
      }
    }
  }
};

// Register common schemas
Object.entries(schemas).forEach(([name, schema]) => {
  registerSchema(name, schema as OpenAPIV3.SchemaObject);
});

// Create and export the API documentation handler router
const apiDocRouter = Router();
createSwaggerMiddleware(apiDocRouter);
export const apiDocHandler = apiDocRouter;
