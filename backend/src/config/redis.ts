import Redis from 'ioredis';
import { config } from './index';

const redisOptions: any = {
  maxRetriesPerRequest: null, // Required for BullMQ and to avoid crash on temp disconnects
  enableReadyCheck: false,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  reconnectOnError(err: Error) {
    return err.message.includes('READONLY') || err.message.includes('ECONNRESET');
  },
};

// Upstash requires TLS (rediss:// URLs)
if (config.REDIS_URL.startsWith('rediss://')) {
  redisOptions.tls = { rejectUnauthorized: false };
}

export const redis = new Redis(config.REDIS_URL, redisOptions);

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export default redis;
