import sharp from 'sharp';
import { env } from '../config/env.js';
import type { AnalysisModuleResult } from '../types/analysis.js';

/**
 * Laplacian-variance blur detection (OpenCV-equivalent approach via Sharp).
 * Native opencv4nodejs is brittle to install in Node; Sharp applies the same
 * Laplacian kernel and variance metric used in classic OpenCV tutorials.
 */
export async function detectBlur(filepath: string): Promise<AnalysisModuleResult> {
  const { data, info } = await sharp(filepath)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  if (width < 3 || height < 3) {
    return {
      blurScore: 0,
      isBlurry: true,
      issues: [
        {
          code: 'BLUR_TOO_SMALL',
          message: 'Image is too small for reliable blur detection',
          severity: 'error',
        },
      ],
    };
  }

  // Laplacian kernel: [[0,1,0],[1,-4,1],[0,1,0]]
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap =
        data[idx - width]! +
        data[idx - 1]! +
        data[idx + 1]! +
        data[idx + width]! -
        4 * data[idx]!;
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  const isBlurry = variance < env.BLUR_THRESHOLD;

  return {
    blurScore: Number(variance.toFixed(2)),
    isBlurry,
    issues: isBlurry
      ? [
          {
            code: 'IMAGE_BLURRY',
            message: `Image appears blurry (score ${variance.toFixed(2)} < ${env.BLUR_THRESHOLD})`,
            severity: 'warning',
          },
        ]
      : [],
  };
}
