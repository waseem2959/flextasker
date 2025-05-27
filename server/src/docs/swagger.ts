/**
 * OpenAPI/Swagger Documentation Configuration
 * 
 * This file defines the Swagger/OpenAPI documentation for the API.
 * It provides detailed information about all API endpoints, request/response schemas,
 * and authentication requirements.
 */

import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../package.json';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Flextasker API',
    version,
    description: 'API documentation for the Flextasker application',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'Flextasker Support',
      url: 'https://flextasker.com/support',
      email: 'support@flextasker.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.flextasker.com/api/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }
    },
    schemas: {
      // Reuse shared type definitions from the frontend
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'An error occurred'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email'
                },
                message: {
                  type: 'string',
                  example: 'Invalid email format'
                },
                code: {
                  type: 'string',
                  example: 'INVALID_EMAIL'
                }
              }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-05-27T15:53:36Z'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'user-123'
          },
          firstName: {
            type: 'string',
            example: 'John'
          },
          lastName: {
            type: 'string',
            example: 'Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com'
          },
          role: {
            type: 'string',
            enum: ['USER', 'TASKER', 'ADMIN'],
            example: 'USER'
          },
          averageRating: {
            type: 'number',
            format: 'float',
            example: 4.5
          },
          trustScore: {
            type: 'number',
            format: 'integer',
            example: 85
          },
          city: {
            type: 'string',
            example: 'New York'
          },
          state: {
            type: 'string',
            example: 'NY'
          },
          country: {
            type: 'string',
            example: 'USA'
          },
          bio: {
            type: 'string',
            example: 'Experienced professional'
          },
          avatar: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/avatars/john.jpg'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-01T00:00:00Z'
          }
        }
      },
      Task: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'task-123'
          },
          title: {
            type: 'string',
            example: 'Fix kitchen sink'
          },
          description: {
            type: 'string',
            example: 'The kitchen sink is leaking and needs to be repaired'
          },
          categoryId: {
            type: 'string',
            example: 'category-1'
          },
          ownerId: {
            type: 'string',
            example: 'user-123'
          },
          assigneeId: {
            type: 'string',
            nullable: true,
            example: 'user-456'
          },
          status: {
            type: 'string',
            enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            example: 'OPEN'
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            example: 'MEDIUM'
          },
          budget: {
            type: 'number',
            format: 'float',
            example: 100
          },
          budgetType: {
            type: 'string',
            enum: ['FIXED', 'HOURLY', 'NEGOTIABLE'],
            example: 'FIXED'
          },
          isRemote: {
            type: 'boolean',
            example: false
          },
          location: {
            type: 'string',
            nullable: true,
            example: 'New York, NY'
          },
          latitude: {
            type: 'number',
            format: 'float',
            nullable: true,
            example: 40.7128
          },
          longitude: {
            type: 'number',
            format: 'float',
            nullable: true,
            example: -74.0060
          },
          deadline: {
            type: 'string',
            format: 'date-time',
            example: '2025-06-30T00:00:00Z'
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            example: ['plumbing', 'repair', 'kitchen']
          },
          requirements: {
            type: 'array',
            items: {
              type: 'string'
            },
            example: ['Tools required', 'Experience with plumbing']
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-05-15T00:00:00Z'
          }
        }
      },
      Bid: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'bid-123'
          },
          taskId: {
            type: 'string',
            example: 'task-123'
          },
          bidderId: {
            type: 'string',
            example: 'user-456'
          },
          amount: {
            type: 'number',
            format: 'float',
            example: 120
          },
          description: {
            type: 'string',
            example: 'I can fix your sink with high-quality parts'
          },
          timeline: {
            type: 'string',
            example: '2 days'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
            example: 'PENDING'
          },
          submittedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-05-16T00:00:00Z'
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'User does not have permission to access the resource',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      NotFoundError: {
        description: 'The requested resource was not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation failed for the request data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      ServerError: {
        description: 'An unexpected error occurred on the server',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Options for the swagger specification
const options = {
  swaggerDefinition,
  // Path to the API docs
  apis: [
    './src/routes/*.ts',
    './src/docs/definitions/*.ts',
    './src/docs/paths/*.ts'
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
