import { Worker } from 'bullmq';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { IMAGE_ANALYSIS_QUEUE, type ImageAnalysisJobData } from './lib/queue.js';
import { createRedisConnection } from './lib/redis.js';
import { runAnalysisPipeline } from './modules/index.js';
import {
  markProcessing,
  saveAnalysisFailure,
  saveAnalysisSuccess,
} from './services/imageService.js';

async function processJob(data: ImageAnalysisJobData): Promise<void> {
  const { imageId, filepath } = data;
  await markProcessing(imageId);

  try {
    const result = await runAnalysisPipeline(imageId, filepath);
    await saveAnalysisSuccess(imageId, result);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown processing error';
    logger.error({ err, imageId }, 'Analysis job failed');
    await saveAnalysisFailure(imageId, reason);
    throw err;
  }
}

async function main() {
  const worker = new Worker<ImageAnalysisJobData>(
    IMAGE_ANALYSIS_QUEUE,
    async (job) => {
      logger.info({ jobId: job.id, imageId: job.data.imageId }, 'Processing analysis job');
      await processJob(job.data);
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
