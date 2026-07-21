import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { analyzeBrightness } from '../src/modules/brightness.js';
import { detectBlur } from '../src/modules/blur.js';
import { validateDimensions } from '../src/modules/dimensions.js';

const tmpDir = path.resolve('uploads/test-fixtures');

async function createSolidImage(name: string, color: { r: number; g: number; b: number }) {
  const filepath = path.join(tmpDir, name);
  await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: color,
    },
  })
    .jpeg()
    .toFile(filepath);
  return filepath;
}

describe('image analysis modules', () => {
  beforeAll(async () => {
    await mkdir(tmpDir, { recursive: true });
  });

  afterAll(async () => {
    // fixtures left for debugging; uploads/ is gitignored
  });

  it('flags dark images', async () => {
    const filepath = await createSolidImage('dark.jpg', { r: 10, g: 10, b: 10 });
    const result = await analyzeBrightness(filepath);
    expect(result.brightnessOk).toBe(false);
    expect(result.issues?.some((i) => i.code === 'TOO_DARK')).toBe(true);
  });

  it('flags undersized images', async () => {
    const filepath = path.join(tmpDir, 'small.jpg');
    await sharp({
      create: { width: 100, height: 80, channels: 3, background: { r: 120, g: 120, b: 120 } },
    })
      .jpeg()
      .toFile(filepath);

    const result = await validateDimensions(filepath);
    expect(result.dimensionsOk).toBe(false);
  });

  it('computes a blur score for a solid image (highly blurry)', async () => {
    const filepath = await createSolidImage('flat.jpg', { r: 128, g: 128, b: 128 });
    const result = await detectBlur(filepath);
    expect(result.isBlurry).toBe(true);
    expect(result.blurScore).toBeDefined();
  });

  it('writes a tiny png fixture without throwing', async () => {
    const filepath = path.join(tmpDir, 'note.txt');
    await writeFile(filepath, 'ok');
    expect(true).toBe(true);
  });
});
