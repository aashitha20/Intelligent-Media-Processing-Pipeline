import { env } from '../config/env.js';

/**
 * Static OpenAPI document — avoids swagger-jsdoc filesystem globs that break
 * on Vercel serverless (no reliable access to src/routes/*.ts at runtime).
 */
export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Intelligent Media Processing Pipeline API',
    version: '1.0.0',
    description:
      'Asynchronous vehicle image upload and analysis API for quality and authenticity checks.',
  },
  servers: [
    {
      url: env.IS_VERCEL ? '/' : `http://localhost:${env.PORT}`,
      description: env.IS_VERCEL ? 'Vercel deployment' : 'Local development',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        responses: {
          200: { description: 'Service is healthy' },
        },
      },
    },
    '/upload': {
      post: {
        summary: 'Upload a vehicle image for analysis',
        tags: ['Images'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          202: { description: 'Image accepted (and processed when PROCESSING_MODE=inline)' },
          400: { description: 'Invalid upload' },
        },
      },
    },
    '/status/{id}': {
      get: {
        summary: 'Get processing status',
        tags: ['Images'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Current status' },
          404: { description: 'Not found' },
        },
      },
    },
    '/result/{id}': {
      get: {
        summary: 'Get structured analysis results',
        tags: ['Images'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Analysis results' },
          404: { description: 'Not found' },
          409: { description: 'Still processing' },
          422: { description: 'Analysis failed' },
        },
      },
    },
    '/failure/{id}': {
      get: {
        summary: 'Get failure details',
        tags: ['Images'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Failure details' },
          404: { description: 'Not found' },
          409: { description: 'Image has not failed' },
        },
      },
    },
  },
};
