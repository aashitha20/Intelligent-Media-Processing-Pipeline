import sharp from 'sharp';
import { prisma } from '../lib/prisma.js';
import type { AnalysisModuleResult } from '../types/analysis.js';

/**
 * Average-hash perceptual fingerprint for near-duplicate detection.
 * Implemented with Sharp (same role as image-hash) to avoid extra native deps.
 */
export async function computePerceptualHash(filepath: string): Promise<string> {
  const { data } = await sharp(filepath)
    .resize(8, 8, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i]!;
  }
  const avg = sum / data.length;

  let bits = '';
  for (let i = 0; i < data.length; i++) {
    bits += data[i]! >= avg ? '1' : '0';
  }

  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) {
    return Number.MAX_SAFE_INTEGER;
  }
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    const nibbleA = parseInt(a[i]!, 16);
    const nibbleB = parseInt(b[i]!, 16);
    let xor = nibbleA ^ nibbleB;
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

export async function detectDuplicate(
  filepath: string,
  imageId: string,
): Promise<AnalysisModuleResult> {
  const perceptualHash = await computePerceptualHash(filepath);

  const candidates = await prisma.analysis.findMany({
    where: {
      perceptualHash: { not: null },
      imageId: { not: imageId },
    },
    select: {
      imageId: true,
      perceptualHash: true,
    },
    take: 500,
    orderBy: { createdAt: 'desc' },
  });

  let duplicateOfId: string | null = null;
  for (const candidate of candidates) {
    if (!candidate.perceptualHash) continue;
    const distance = hammingDistance(perceptualHash, candidate.perceptualHash);
    if (distance <= 5) {
      duplicateOfId = candidate.imageId;
      break;
    }
  }

  const isDuplicate = Boolean(duplicateOfId);

  return {
    perceptualHash,
    isDuplicate,
    duplicateOfId,
    issues: isDuplicate
      ? [
          {
            code: 'DUPLICATE_IMAGE',
            message: `Image appears to be a duplicate of ${duplicateOfId}`,
            severity: 'warning',
          },
        ]
      : [],
  };
}
