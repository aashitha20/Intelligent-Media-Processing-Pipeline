import { logger } from '../lib/logger.js';
import { runAnalysisPipeline } from '../modules/index.js';
import {
  markProcessing,
  saveAnalysisFailure,
  saveAnalysisSuccess,
} from './imageService.js';

export async function processImageAnalysis(imageId: string, filepath: string): Promise<void> {
  await markProcessing(imageId);

  try {
    const result = await runAnalysisPipeline(imageId, filepath);
    await saveAnalysisSuccess(imageId, result);
    logger.info({ imageId }, 'Image analysis saved successfully');
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown processing error';
    logger.error({ err, imageId }, 'Analysis job failed');
    await saveAnalysisFailure(imageId, reason);
    throw err;
  }
}
