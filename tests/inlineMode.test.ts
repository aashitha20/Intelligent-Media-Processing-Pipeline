import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

// Force inline mode before importing app modules that read env.
process.env.PROCESSING_MODE = 'inline';

describe('inline processing mode', () => {
  let app: ReturnType<Awaited<typeof import('../src/app.js')>['createApp']>;

  beforeAll(async () => {
    const { ensureUploadDir } = await import('../src/middleware/upload.js');
    const { createApp } = await import('../src/app.js');
    await ensureUploadDir();
    app = createApp();
  });

  it('serves health and docs', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');

    const docs = await request(app).get('/docs.json');
    expect(docs.status).toBe(200);
    expect(docs.body.paths['/upload']).toBeTruthy();
  });

  it('uploads and processes image_2 inline to COMPLETED', async () => {
    const up = await request(app).post('/upload').attach('image', 'image_2.jpg');
    expect([200, 202]).toContain(up.status);
    expect(up.body.id).toBeTruthy();

    const st = await request(app).get(`/status/${up.body.id}`);
    expect(st.status).toBe(200);
    expect(st.body.status).toBe('COMPLETED');

    const rs = await request(app).get(`/result/${up.body.id}`);
    expect(rs.status).toBe(200);
    expect(rs.body.analysis.confidence).toBeTypeOf('number');
    expect(Array.isArray(rs.body.analysis.issues)).toBe(true);
  }, 120_000);
});
