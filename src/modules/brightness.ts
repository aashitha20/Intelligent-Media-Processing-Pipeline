import sharp from 'sharp';
import { env } from '../config/env.js';
import type { AnalysisModuleResult } from '../types/analysis.js';

export async function analyzeBrightness(filepath: string): Promise<AnalysisModuleResult> {
  const { data } = await sharp(filepath).greyscale().raw().toBuffer({ resolveWithObject: true });

  let total = 0;
  for (let i = 0; i < data.length; i++) {
    total += data[i]!;
  }

  const brightness = Number((total / data.length).toFixed(2));
  const brightnessOk = brightness >= env.BRIGHTNESS_MIN && brightness <= env.BRIGHTNESS_MAX;

  const issues = [];
  if (brightness < env.BRIGHTNESS_MIN) {
    issues.push({
      code: 'TOO_DARK',
      message: `Image is too dark (brightness ${brightness} < ${env.BRIGHTNESS_MIN})`,
      severity: 'warning' as const,
    });
  } else if (brightness > env.BRIGHTNESS_MAX) {
    issues.push({
      code: 'TOO_BRIGHT',
      message: `Image is too bright (brightness ${brightness} > ${env.BRIGHTNESS_MAX})`,
      severity: 'warning' as const,
    });
  }

  return { brightness, brightnessOk, issues };
}
