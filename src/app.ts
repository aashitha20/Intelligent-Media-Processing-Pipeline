import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { failureRouter } from './routes/failure.js';
import { resultRouter } from './routes/result.js';
import { statusRouter } from './routes/status.js';
import { uploadRouter } from './routes/upload.js';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // Swagger UI loads inline scripts/styles; relax CSP only for docs UX.
      contentSecurityPolicy: false,
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use('/upload', uploadRouter);
  app.use('/status', statusRouter);
  app.use('/result', resultRouter);
  app.use('/failure', failureRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
