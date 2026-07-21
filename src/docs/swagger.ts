import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env.js';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Intelligent Media Processing Pipeline API',
      version: '1.0.0',
      description:
        'Asynchronous vehicle image upload and analysis API for quality and authenticity checks.',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Local development',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
});
