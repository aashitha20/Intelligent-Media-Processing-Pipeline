import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export function createRedisConnection(): Redis {
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  connection.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
  });

  return connection;
}
