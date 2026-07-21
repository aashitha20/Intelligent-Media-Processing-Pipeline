import { Worker } from 'bullmq';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { IMAGE_ANALYSIS_QUEUE, type ImageAnalysisJobData } from './lib/queue.js';
import { createRedisConnection } from './lib/redis.js';
import { processImageAnalysis } from './services/processingService.js';

async function main() {
  if (env.PROCESSING_MODE === 'inline') {
    logger.warn(
      'PROCESSING_MODE=inline — BullMQ worker is not needed. Exiting worker process.',
    );
    process.exit(0);
  }

  const worker = new Worker<ImageAnalysisJobData>(
    IMAGE_ANALYSIS_QUEUE,
    async (job) => {
      logger.info({ jobId: job.id, imageId: job.data.imageId }, 'Processing analysis job');
      await processImageAnalysis(job.data.imageId, job.data.filepath);
    },
    {
      connection: createRedisConnection(),
      concurrency: 2,
    },
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Job failed');
  });

  logger.info(
    { queue: IMAGE_ANALYSIS_QUEUE, redis: env.REDIS_URL },
    'Image analysis worker started',
  );
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start worker');
  process.exit(1);
});
