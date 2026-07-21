import { ImageStatus, type Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AggregatedAnalysis } from '../types/analysis.js';

export async function createImageAndEnqueue(input: {
  filename: string;
  filepath: string;
  mimeType?: string;
  sizeBytes?: number;
}): Promise<{ id: string; status: ImageStatus }> {
  const image = await prisma.image.create({
    data: {
      filename: input.filename,
      filepath: input.filepath,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      status: ImageStatus.PENDING,
    },
  });

  // Vercel serverless cannot run a long-lived BullMQ worker.
  // Inline mode processes the image inside the same function invocation.
  // Prefer live process.env so PLATFORM/test overrides work after module load.
  const processingMode =
    process.env.PROCESSING_MODE === 'inline' || process.env.PROCESSING_MODE === 'queue'
      ? process.env.PROCESSING_MODE
      : env.PROCESSING_MODE;

  if (processingMode === 'inline') {
    const { processImageAnalysis } = await import('./processingService.js');
    await processImageAnalysis(image.id, image.filepath);
    const refreshed = await prisma.image.findUnique({
      where: { id: image.id },
      select: { id: true, status: true },
    });
    return { id: image.id, status: refreshed?.status ?? ImageStatus.COMPLETED };
  }

  const { getAnalysisQueue } = await import('../lib/queue.js');
  await getAnalysisQueue().add(
    'analyze',
    { imageId: image.id, filepath: image.filepath },
    { jobId: image.id },
  );

  return { id: image.id, status: image.status };
}

export async function getImageStatus(id: string) {
  const image = await prisma.image.findUnique({
    where: { id },
    select: {
      id: true,
      filename: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!image) {
    throw new AppError(404, `Image ${id} not found`);
  }

  return image;
}

export async function getImageResult(id: string) {
  const image = await prisma.image.findUnique({
    where: { id },
    include: { analysis: true },
  });

  if (!image) {
    throw new AppError(404, `Image ${id} not found`);
  }

  if (image.status === ImageStatus.PENDING || image.status === ImageStatus.PROCESSING) {
    throw new AppError(409, 'Analysis still in progress', { status: image.status });
  }

  if (image.status === ImageStatus.FAILED) {
    throw new AppError(422, 'Analysis failed', {
      status: image.status,
      failureReason: image.analysis?.failureReason ?? 'Unknown failure',
    });
  }

  return {
    id: image.id,
    filename: image.filename,
    status: image.status,
    analysis: image.analysis,
  };
}

export async function getImageFailure(id: string) {
  const image = await prisma.image.findUnique({
    where: { id },
    include: { analysis: true },
  });

  if (!image) {
    throw new AppError(404, `Image ${id} not found`);
  }

  if (image.status !== ImageStatus.FAILED) {
    throw new AppError(409, 'Image has not failed', { status: image.status });
  }

  return {
    id: image.id,
    status: image.status,
    failureReason: image.analysis?.failureReason ?? 'Unknown failure',
    issues: image.analysis?.issues ?? [],
    completedAt: image.analysis?.completedAt ?? null,
  };
}

export async function markProcessing(imageId: string): Promise<void> {
  await prisma.image.update({
    where: { id: imageId },
    data: { status: ImageStatus.PROCESSING },
  });
}

export async function saveAnalysisSuccess(
  imageId: string,
  result: AggregatedAnalysis,
): Promise<void> {
  await prisma.$transaction([
    prisma.analysis.upsert({
      where: { imageId },
      create: {
        imageId,
        blurScore: result.blurScore,
        isBlurry: result.isBlurry,
        brightness: result.brightness,
        brightnessOk: result.brightnessOk,
        perceptualHash: result.perceptualHash,
        isDuplicate: result.isDuplicate ?? false,
        duplicateOfId: result.duplicateOfId ?? null,
        ocrText: result.ocrText,
        numberPlate: result.numberPlate ?? null,
        numberPlateValid: result.numberPlateValid ?? null,
        width: result.width,
        height: result.height,
        dimensionsOk: result.dimensionsOk,
        metadata: (result.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
        metadataOk: result.metadataOk,
        confidence: result.confidence,
        issues: result.issues.map((i) => `${i.code}: ${i.message}`),
        completedAt: new Date(),
      },
      update: {
        blurScore: result.blurScore,
        isBlurry: result.isBlurry,
        brightness: result.brightness,
        brightnessOk: result.brightnessOk,
        perceptualHash: result.perceptualHash,
        isDuplicate: result.isDuplicate ?? false,
        duplicateOfId: result.duplicateOfId ?? null,
        ocrText: result.ocrText,
        numberPlate: result.numberPlate ?? null,
        numberPlateValid: result.numberPlateValid ?? null,
        width: result.width,
        height: result.height,
        dimensionsOk: result.dimensionsOk,
        metadata: (result.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
        metadataOk: result.metadataOk,
        confidence: result.confidence,
        issues: result.issues.map((i) => `${i.code}: ${i.message}`),
        failureReason: null,
        completedAt: new Date(),
      },
    }),
    prisma.image.update({
      where: { id: imageId },
      data: { status: ImageStatus.COMPLETED },
    }),
  ]);
}

export async function saveAnalysisFailure(imageId: string, reason: string): Promise<void> {
  await prisma.$transaction([
    prisma.analysis.upsert({
      where: { imageId },
      create: {
        imageId,
        failureReason: reason,
        issues: [`PIPELINE_ERROR: ${reason}`],
        completedAt: new Date(),
      },
      update: {
        failureReason: reason,
        issues: [`PIPELINE_ERROR: ${reason}`],
        completedAt: new Date(),
      },
    }),
    prisma.image.update({
      where: { id: imageId },
      data: { status: ImageStatus.FAILED },
    }),
  ]);
}
