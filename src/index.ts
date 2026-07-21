import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { ensureUploadDir } from './middleware/upload.js';

async function main() {
  // On Vercel, api/index.ts is the entrypoint — do not bind a port.
  if (env.IS_VERCEL) {
    logger.info('VERCEL runtime detected; skipping app.listen() (use api/index.ts)');
    return;
  }

  await ensureUploadDir();
  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
    logger.info(`Swagger docs at http://localhost:${env.PORT}/docs`);
    logger.info({ processingMode: env.PROCESSING_MODE }, 'Processing mode');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start API server');
  process.exit(1);
});
