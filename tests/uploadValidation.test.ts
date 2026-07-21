import { describe, expect, it } from 'vitest';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { assertValidImageFile } from '../src/middleware/upload.js';

const tmpDir = path.resolve('uploads/test-fixtures');

describe('assertValidImageFile', () => {
  it('accepts webp content even when client mime is octet-stream', async () => {
    await mkdir(tmpDir, { recursive: true });
    const filepath = path.join(tmpDir, 'sniff-webp.img');
    await sharp({
      create: { width: 64, height: 64, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .webp()
      .toFile(filepath);

    const result = await assertValidImageFile({
      path: filepath,
      mimetype: 'application/octet-stream',
      originalname: 'sniff-webp.img',
      size: 100,
    } as Express.Multer.File);

    expect(result.format).toBe('webp');
    expect(result.mimeType).toBe('image/webp');
    expect(result.filepath.endsWith('.webp')).toBe(true);
  });

  it('rejects non-image bytes', async () => {
    await mkdir(tmpDir, { recursive: true });
    const filepath = path.join(tmpDir, 'not-image.bin');
    await writeFile(filepath, 'hello world');

    await expect(
      assertValidImageFile({
        path: filepath,
        mimetype: 'application/octet-stream',
        originalname: 'not-image.bin',
        size: 11,
      } as Express.Multer.File),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
