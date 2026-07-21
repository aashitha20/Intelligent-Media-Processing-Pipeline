import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

/** Client-declared types we accept before content sniffing. */
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  // curl and some browsers send this when the OS MIME map is incomplete
  'application/octet-stream',
]);

export async function ensureUploadDir(): Promise<string> {
  const dir = path.resolve(env.UPLOAD_DIR);
  await mkdir(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      const dir = await ensureUploadDir();
      cb(null, dir);
    } catch (err) {
      cb(err as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.img';
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    if (ALLOWED_MIME.has(mime) || mime.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

/**
 * Validate the uploaded file by content (magic bytes via Sharp), not client MIME.
 * Renames extension to match the real format when needed (e.g. WebP saved as .png).
 */
export async function assertValidImageFile(file: Express.Multer.File): Promise<{
  filepath: string;
  mimeType: string;
  format: string;
}> {
  try {
    const meta = await sharp(file.path).metadata();
    const format = meta.format ?? '';

    if (!ALLOWED_FORMATS.has(format)) {
      await unlink(file.path).catch(() => undefined);
      throw new AppError(400, 'Only JPEG, PNG, and WebP images are allowed');
    }

    const mimeType =
      format === 'jpeg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp';

    const correctExt = format === 'jpeg' ? '.jpg' : `.${format}`;
    const currentExt = path.extname(file.path).toLowerCase();
    let filepath = file.path;

    if (currentExt !== correctExt) {
      const renamed = file.path.slice(0, file.path.length - currentExt.length) + correctExt;
      const { rename } = await import('node:fs/promises');
      await rename(file.path, renamed);
      filepath = renamed;
    }

    return { filepath, mimeType, format };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    await unlink(file.path).catch(() => undefined);
    throw new AppError(400, 'Invalid or corrupted image file');
  }
}
