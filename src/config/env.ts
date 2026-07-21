import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6379'),
  UPLOAD_DIR: z.string().default('./uploads'),
  LOG_LEVEL: z.string().default('info'),
  BLUR_THRESHOLD: z.coerce.number().positive().default(100),
  BRIGHTNESS_MIN: z.coerce.number().min(0).max(255).default(40),
  BRIGHTNESS_MAX: z.coerce.number().min(0).max(255).default(220),
  MIN_WIDTH: z.coerce.number().int().positive().default(640),
  MIN_HEIGHT: z.coerce.number().int().positive().default(480),
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;
