# Intelligent Media Processing Pipeline - Backend + AI Engineering Take-Home Assignment

Asynchronous backend that accepts vehicle image uploads, runs quality/authenticity analysis in the background, and exposes APIs for status and structured results.

## Hosted on : [Intelligent Media Processing Pipeline](https://intelligent-media-processing-pipeline-production-aa93.up.railway.app/docs/)

---

## Stack review (MVP)

| Choice | Fit | Notes |
|--------|-----|-------|
| Node.js + TypeScript + Express | Excellent | Clean API layer, strong async model |
| PostgreSQL + Prisma | Excellent | Structured results, typed schema, migrations |
| BullMQ + Redis | Excellent | Reliable async jobs with retries |
| Sharp | Excellent | Fast native image ops for blur/brightness/dims/metadata |
| Tesseract (`tesseract.js`) | Good | OCR without a separate service; slower than native but fine for MVP |
| Zod + Pino + Swagger + Vitest | Excellent | Validation, logs, docs, tests |
| Local `/uploads` | Good for MVP | Swap to S3 later without changing the pipeline contract |
| OpenCV (native) | Poor Node fit | `opencv4nodejs` is fragile to build; **MVP uses Sharp Laplacian variance** (same metric as classic OpenCV blur tutorials). Module boundary keeps a future OpenCV swap possible |
| `image-hash` package | Optional | MVP implements average-hash with Sharp for fewer dependencies |

**Verdict:** The stack matches the requirements well. The only adjustment for a reliable MVP is preferring Sharp over native OpenCV bindings in Node.

## Architecture

```
POST /upload → validate → save file → DB (PENDING) → BullMQ → 202 { id }
                                      ↓
                               Worker pipeline
                    blur | brightness | OCR/plate | duplicate | dims | metadata
                                      ↓
                               DB (COMPLETED | FAILED)
GET /status/:id | GET /result/:id | GET /failure/:id
```

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- (Optional) Docker for Postgres/Redis

### With Docker Compose

```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev          # API on :3000
npm run dev:worker   # background worker (separate terminal)
```

### Local services (already used in this environment)

```bash
# Postgres: postgresql://media:media@localhost:5432/media_pipeline
# Redis: redis://127.0.0.1:6379
npm install
npx prisma migrate deploy
npm run dev
npm run dev:worker
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/upload` | Multipart field `image` → `202` with processing id |
| `GET` | `/status/:id` | Processing status |
| `GET` | `/result/:id` | Structured analysis when complete |
| `GET` | `/failure/:id` | Failure details when status is `FAILED` |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/health` | Liveness |

### Example

```bash
curl -F "image=@./vehicle.jpg" http://localhost:3000/upload
curl http://localhost:3000/status/<id>
curl http://localhost:3000/result/<id>
```

## Analysis modules

- **Blur** — Laplacian variance via Sharp
- **Brightness** — mean greyscale luminance
- **Duplicate** — perceptual average-hash + Hamming distance
- **OCR** — Tesseract.js English
- **Number plate** — Indian plate format validation
- **Dimensions** — minimum width/height checks
- **Metadata** — format/EXIF presence inspection

## Scripts

```bash
npm run dev          # API (tsx watch)
npm run dev:worker   # Worker (tsx watch)
npm run build        # Compile TypeScript
npm test             # Vitest
npm run lint         # tsc --noEmit
```

## Project layout

```
src/
  index.ts / worker.ts / app.ts
  config/ modules/ routes/ services/ middleware/ lib/ docs/
prisma/schema.prisma
uploads/
tests/
```
