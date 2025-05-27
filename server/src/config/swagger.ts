/**
 * Swagger Configuration
 * 
 * This file configures the Swagger UI and serves the OpenAPI documentation.
 */

import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../docs/swagger';

/**
 * Configures and initializes Swagger documentation
 * 
 * @param app Express application instance
 */
export function setupSwagger(app: Application): void {
  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    }
  }));
  
  // Serve swagger spec as JSON for external tools
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('Swagger documentation available at /api-docs');
}
