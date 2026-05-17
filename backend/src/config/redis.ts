import Redis from 'ioredis';
import { config } from './index';

const redisOptions: any = {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Upstash requires TLS (rediss:// URLs)
if (config.REDIS_URL.startsWith('rediss://')) {
  redisOptions.tls = { rejectUnauthorized: false };
}

export const redis = new Redis(config.REDIS_URL, redisOptions);

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export default redis;
