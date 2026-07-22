# Root Cause

The Vercel deployment crashed with `500 INTERNAL_SERVER_ERROR` / `FUNCTION_INVOCATION_FAILED` because this project is a **long-running Express + BullMQ worker Node app**, but Vercel runs **short-lived Serverless Functions**.

Exact incompatibilities that caused the failure:

1. **No serverless entrypoint** — the app started via `app.listen(PORT)` in `src/index.ts`. Vercel does not keep a persistent HTTP server process; without an `api/` handler + `vercel.json` rewrites, function invocation fails at runtime.
2. **BullMQ worker cannot run on Vercel** — background workers need a continuously running Node process. Vercel Functions freeze/end after the response; no worker was available to drain the queue even if Redis existed.
3. **Local filesystem uploads (`./uploads`)** — Vercel’s filesystem is ephemeral and mostly read-only outside `/tmp`. Writing to `./uploads` is not production-safe.
4. **Environment crash amplification** — `DATABASE_URL` is required at module import (`zod` parse). If unset in Vercel Project Settings, every invocation fails immediately during cold start (also surfaces as `FUNCTION_INVOCATION_FAILED`).
5. **Swagger filesystem globs** — `swagger-jsdoc` scanned `./src/routes/*.ts`, which is unreliable in the serverless bundle.

Build could appear “successful” while runtime requests still 500 — matching the observed Vercel behavior (deployment completed, function invocation failed).

---

# Issues Found

| # | Issue | Severity |
|---|--------|----------|
| 1 | Express `listen()` long-running server used as Vercel entry | Critical |
| 2 | No `vercel.json` / `api/` serverless adapter | Critical |
| 3 | BullMQ worker assumed always available | Critical (async path) |
| 4 | Uploads written under `./uploads` (non-persistent on Vercel) | High |
| 5 | `DATABASE_URL` / Redis env not documented for Vercel | High |
| 6 | Prisma client may be missing without `prisma generate` in build | High |
| 7 | Swagger relied on runtime FS globs + localhost server URL | Medium |
| 8 | Helmet default CSP can interfere with Swagger UI scripts | Low |
| 9 | Deployment URL protected by Vercel SSO (blocks unauthenticated probes) | Ops |

---

# Fixes Applied

1. **Added Vercel serverless entry** — `api/index.ts` exports a request handler that boots the Express app **without** `app.listen()`.
2. **Added `vercel.json`** — rewrites all routes to `/api`, sets `maxDuration: 60`, includes Prisma files, runs `prisma generate && tsc`.
3. **Inline processing mode** — `PROCESSING_MODE=inline` (default when `VERCEL=1`) runs analysis inside the upload function so no BullMQ worker is required on Vercel.
4. **Upload directory** — defaults to `/tmp/uploads` on Vercel.
5. **Shared `processImageAnalysis` service** — used by both the BullMQ worker (local) and inline mode (Vercel).
6. **Static OpenAPI spec** — replaced swagger-jsdoc file globs with an in-code spec.
7. **Build scripts** — `postinstall` / `build` / `vercel-build` run `prisma generate`.
8. **Safer env messaging** — clearer Zod errors when `DATABASE_URL` is missing.
9. **Helmet CSP relaxed** so Swagger UI can load.
10. **`.vercelignore`** — excludes `uploads`, `dump.rdb`, `eng.traineddata`, etc.
11. **Local `src/index.ts`** — skips `listen()` when `VERCEL` is detected.

### Required Vercel Environment Variables

Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | **Yes** | Postgres connection string (use SSL, e.g. Neon/Supabase `?sslmode=require`) |
| `PROCESSING_MODE` | Optional | Defaults to `inline` on Vercel |
| `UPLOAD_DIR` | Optional | Defaults to `/tmp/uploads` on Vercel |
| `REDIS_URL` | Optional on Vercel | Only needed for `PROCESSING_MODE=queue` on a long-running host |
| `LOG_LEVEL` | Optional | default `info` |
| `BLUR_THRESHOLD` / `BRIGHTNESS_*` / `MIN_*` | Optional | analysis thresholds |

Also run migrations against the production DB once:

```bash
DATABASE_URL="your-prod-url" npx prisma migrate deploy
```

---

# Production Limitations

1. **No long-running BullMQ worker on Vercel**  
   Async queue mode is for local/Docker/VM. On Vercel, processing is **inline** in the upload request (up to function timeout).

2. **Ephemeral uploads**  
   Files in `/tmp` disappear when the instance recycles. Analysis runs immediately while the file exists. Durable object storage (S3/Blob) is a future improvement.

3. **Function timeout / memory**  
   OCR (Tesseract.js) can be slow. Configured `maxDuration: 60` and `memory: 1024`. Hobby plans may still time out on large images — Pro/Fluid or external worker recommended for heavy OCR.

4. **Redis**  
   Not required for Vercel inline mode. For true async scale-out, run API + worker on a platform that supports persistent processes (Railway, Render, Fly.io, ECS) with managed Redis.

5. **SSO on preview URLs**  
   Some Vercel deployment URLs require team login; use the production domain or disable Deployment Protection for public API testing.

---

# Final Status

| Check | Status |
|-------|--------|
| Deployment configuration fixed (serverless entry + vercel.json) | ✅ |
| Local tests / typecheck | ✅ (14/14 tests) |
| APIs designed to work on Vercel (with `DATABASE_URL`) | ✅ |
| Swagger served from static spec at `/docs` | ✅ |
| Upload API works with inline processing | ✅ (code path) |
| Background BullMQ worker on Vercel | ❌ Not supported — replaced by inline mode |
| Live Vercel verification from this agent | ⚠️ Blocked by Deployment Protection SSO + no Vercel CLI auth in environment |

### What you must do in the Vercel dashboard

1. Set `DATABASE_URL` (and optionally other vars above).
2. Run `prisma migrate deploy` against that database.
3. Redeploy (push to the connected branch or “Redeploy” in the dashboard).
4. Open `/health` and `/docs` on the production URL.
5. Upload `image_1.jpg` via `/docs` or `curl` and poll `/status/:id` + `/result/:id`.

**Architecture after fix:**

- **Local:** `PROCESSING_MODE=queue` + `npm run dev` + `npm run dev:worker` (original design).
- **Vercel:** `PROCESSING_MODE=inline` serverless Express handler — upload triggers analysis in-request, no separate worker.
