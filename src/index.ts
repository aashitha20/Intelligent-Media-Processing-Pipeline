import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { ensureUploadDir } from './middleware/upload.js';

async function main() {
  await ensureUploadDir();
  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
    logger.info(`Swagger docs at http://localhost:${env.PORT}/docs`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start API server');
  process.exit(1);
});
