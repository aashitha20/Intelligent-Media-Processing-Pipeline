import sharp from 'sharp';
import type { AnalysisModuleResult } from '../types/analysis.js';

export async function inspectMetadata(filepath: string): Promise<AnalysisModuleResult> {
  const meta = await sharp(filepath).metadata();

  const metadata: Record<string, unknown> = {
    format: meta.format,
    width: meta.width,
    height: meta.height,
    space: meta.space,
    channels: meta.channels,
    depth: meta.depth,
    density: meta.density,
    hasProfile: meta.hasProfile,
    hasAlpha: meta.hasAlpha,
    orientation: meta.orientation,
    exifPresent: Boolean(meta.exif),
    iccPresent: Boolean(meta.icc),
  };

  const issues = [];
  let metadataOk = true;

  if (!meta.format) {
    metadataOk = false;
    issues.push({
      code: 'METADATA_MISSING_FORMAT',
      message: 'Unable to determine image format',
      severity: 'error' as const,
    });
  }

  // Missing EXIF is informative for authenticity checks, not a hard failure
  if (!meta.exif) {
    issues.push({
      code: 'METADATA_NO_EXIF',
      message: 'No EXIF metadata present (common for edited or re-exported images)',
      severity: 'info' as const,
    });
  }

  return { metadata, metadataOk, issues };
}
