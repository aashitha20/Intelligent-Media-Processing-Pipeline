import { createApp } from '../src/app.js';
import { ensureUploadDir } from '../src/middleware/upload.js';

const app = createApp();

let booted: Promise<void> | undefined;

/**
 * Vercel Serverless entrypoint.
 * Express long-running `app.listen()` is not used here — Vercel invokes this
 * handler per request.
 */
export default async function handler(req: unknown, res: unknown) {
  booted ??= ensureUploadDir().then(() => undefined);
  await booted;
  return (app as unknown as (req: unknown, res: unknown) => unknown)(req, res);
}
