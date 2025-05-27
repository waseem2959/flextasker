# Flextasker API Documentation

This directory contains the OpenAPI/Swagger documentation for the Flextasker API. This documentation serves as both a reference and a living specification for our REST API endpoints.

## Overview

Our API documentation is built using the following technologies:
- [Swagger/OpenAPI 3.0](https://swagger.io/specification/) for API specification
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) for documentation generation from JSDoc comments
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) for rendering interactive documentation

## Documentation Structure

The documentation is organized as follows:

```
docs/
├── swagger.ts         # Main Swagger configuration
├── paths/             # API endpoint documentation
│   ├── tasks.ts       # Task endpoints
│   ├── bids.ts        # Bid endpoints
│   └── ...            # Other endpoint documentation
├── definitions/       # Schema definitions
│   └── ...            # Additional schema definitions
└── README.md          # This file
```

## How to Access Documentation

When the server is running, you can access the interactive API documentation at:

```
http://localhost:5000/api-docs
```

This interactive UI allows you to:
- Explore available endpoints
- See request/response schemas
- Test endpoints directly from the browser
- View authentication requirements

## How to Document New Endpoints

When adding new endpoints to the API, please document them using JSDoc comments in your route files. For example:

```typescript
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users. Requires admin privileges.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/', userController.getAllUsers);
```

## Best Practices

1. **Always document new endpoints** - This ensures our documentation stays up-to-date
2. **Use tags for grouping** - Assign relevant tags to organize the documentation
3. **Reference shared schemas** - Use `$ref` to reference schemas defined in the components section
4. **Include examples** - Add example values to make the documentation more helpful
5. **Document security requirements** - Clearly specify which endpoints require authentication
6. **Document error responses** - Include all possible error responses for each endpoint

## Schema Definitions

For consistency, we've defined standard schemas in the `swagger.ts` file. Reference these schemas in your endpoint documentation:

- `Error` - Standard error response
- `User` - User object
- `Task` - Task object
- `Bid` - Bid object

## Standard Response Format

All API endpoints follow a standard response format:

```typescript
{
  success: boolean,      // Whether the request was successful
  message: string,       // Optional message describing the result
  data: any,             // The response data (omitted for errors)
  errors?: Array<{       // Array of errors (only for error responses)
    field: string,       // The field that had an error
    message: string,     // Error message
    code: string         // Error code
  }>,
  timestamp: string      // ISO timestamp of the response
}
```

## Maintaining Documentation

As the API evolves:

1. Update the documentation when endpoints change
2. Add new schemas as needed in the components section
3. Run the API documentation UI to verify changes
4. Ensure all endpoints are properly documented before merging PRs
