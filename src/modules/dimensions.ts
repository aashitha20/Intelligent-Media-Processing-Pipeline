import sharp from 'sharp';
import { env } from '../config/env.js';
import type { AnalysisModuleResult } from '../types/analysis.js';

export async function validateDimensions(filepath: string): Promise<AnalysisModuleResult> {
  const metadata = await sharp(filepath).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const dimensionsOk = width >= env.MIN_WIDTH && height >= env.MIN_HEIGHT;

  return {
    width,
    height,
    dimensionsOk,
    issues: dimensionsOk
      ? []
      : [
          {
            code: 'DIMENSIONS_TOO_SMALL',
            message: `Image dimensions ${width}x${height} below minimum ${env.MIN_WIDTH}x${env.MIN_HEIGHT}`,
            severity: 'warning',
          },
        ],
  };
}
