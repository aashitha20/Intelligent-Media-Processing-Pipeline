import { Queue } from 'bullmq';
import { createRedisConnection } from './redis.js';

export const IMAGE_ANALYSIS_QUEUE = 'image-analysis';

export type ImageAnalysisJobData = {
  imageId: string;
  filepath: string;
};

let queue: Queue<ImageAnalysisJobData> | null = null;

export function getAnalysisQueue(): Queue<ImageAnalysisJobData> {
  if (!queue) {
    queue = new Queue<ImageAnalysisJobData>(IMAGE_ANALYSIS_QUEUE, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }

  return queue;
}
