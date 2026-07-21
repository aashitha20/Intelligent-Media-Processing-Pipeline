import { config } from 'dotenv';
import { z } from 'zod';

config();

const isVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required (set it in Vercel Project Settings → Environment Variables)'),
  REDIS_URL: z.string().min(1).optional(),
  UPLOAD_DIR: z
    .string()
    .default(isVercel ? '/tmp/uploads' : './uploads'),
  LOG_LEVEL: z.string().default('info'),
  BLUR_THRESHOLD: z.coerce.number().positive().default(100),
  BRIGHTNESS_MIN: z.coerce.number().min(0).max(255).default(40),
  BRIGHTNESS_MAX: z.coerce.number().min(0).max(255).default(220),
  MIN_WIDTH: z.coerce.number().int().positive().default(640),
  MIN_HEIGHT: z.coerce.number().int().positive().default(480),
  /**
   * queue = BullMQ worker (local/long-running hosts)
   * inline = process inside the API request (required on Vercel serverless)
   */
  PROCESSING_MODE: z.enum(['queue', 'inline']).default(isVercel ? 'inline' : 'queue'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.flatten().fieldErrors;
  const message = `Invalid environment configuration: ${JSON.stringify(details)}`;
  // Fail loudly with a clear message in serverless logs
  console.error(message);
  throw new Error(message);
}

export const env = {
  ...parsed.data,
  REDIS_URL: parsed.data.REDIS_URL ?? 'redis://127.0.0.1:6379',
  IS_VERCEL: isVercel,
  IS_SERVERLESS: isVercel || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME),
};

export type Env = typeof env;
