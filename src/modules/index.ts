import { logger } from '../lib/logger.js';
import type { AggregatedAnalysis, AnalysisModuleResult, ModuleIssue } from '../types/analysis.js';
import { detectBlur } from './blur.js';
import { analyzeBrightness } from './brightness.js';
import { validateDimensions } from './dimensions.js';
import { detectDuplicate } from './duplicate.js';
import { inspectMetadata } from './metadata.js';
import { runOcr } from './ocr.js';

function mergeResults(parts: AnalysisModuleResult[]): AggregatedAnalysis {
  const issues: ModuleIssue[] = [];
  const merged: AnalysisModuleResult = {};

  for (const part of parts) {
    Object.assign(merged, part);
    if (part.issues?.length) {
      issues.push(...part.issues);
    }
  }

  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const confidence = Math.max(0, Number((1 - warningCount * 0.12 - errorCount * 0.25).toFixed(2)));

  return {
    ...merged,
    issues,
    confidence,
  };
}

export async function runAnalysisPipeline(
  imageId: string,
  filepath: string,
): Promise<AggregatedAnalysis> {
  logger.info({ imageId, filepath }, 'Starting analysis pipeline');

  const [blur, brightness, dimensions, metadata, duplicate, ocr] = await Promise.all([
    detectBlur(filepath),
    analyzeBrightness(filepath),
    validateDimensions(filepath),
    inspectMetadata(filepath),
    detectDuplicate(filepath, imageId),
    runOcr(filepath),
  ]);

  const aggregated = mergeResults([blur, brightness, dimensions, metadata, duplicate, ocr]);
  logger.info(
    { imageId, confidence: aggregated.confidence, issueCount: aggregated.issues.length },
    'Analysis pipeline completed',
  );
  return aggregated;
}

export {
  detectBlur,
  analyzeBrightness,
  validateDimensions,
  inspectMetadata,
  detectDuplicate,
  runOcr,
};
