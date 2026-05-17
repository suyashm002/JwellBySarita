import cron from 'node-cron';
import axios from 'axios';
import prisma from '../config/database';
import redis from '../config/redis';
import { config } from '../config';
import logger from '../utils/logger';

let io: any = null;

export function setSilverRateIO(socketIO: any) {
  io = socketIO;
}

async function fetchSilverRate() {
  try {
    let ratePerGram: number;
    let ratePerKg: number;
    let apiResponse: any = null;

    if (config.SILVER_RATE_API_KEY) {
      // Fetch from MetalpriceAPI
      const { data } = await axios.get(`${config.SILVER_RATE_API_URL}/latest`, {
        params: {
          api_key: config.SILVER_RATE_API_KEY,
          base: 'INR',
          currencies: 'XAG',
        },
      });

      // API returns price per troy ounce - convert to per gram
      // 1 troy ounce = 31.1035 grams
      const pricePerOunce = data?.rates?.INRXAG || data?.rates?.XAG;
      if (pricePerOunce) {
        ratePerGram = pricePerOunce / 31.1035;
        ratePerKg = ratePerGram * 1000;
        apiResponse = data;
      } else {
        throw new Error('Invalid API response');
      }
    } else {
      // Fallback: use a simulated rate for development
      // Average silver rate in India: ~₹85-95 per gram
      const baseRate = 90 + (Math.random() * 5 - 2.5); // Fluctuate around ₹90
      ratePerGram = Math.round(baseRate * 100) / 100;
      ratePerKg = Math.round(ratePerGram * 1000 * 100) / 100;
    }

    // Get buffer percentage from settings
    let bufferPercent = config.SILVER_RATE_BUFFER_PERCENT;
    const bufferSetting = await prisma.setting.findUnique({ where: { key: 'silver_buffer_percent' } });
    if (bufferSetting) {
      bufferPercent = Number((bufferSetting.value as any)?.percent || bufferPercent);
    }

    const effectiveRate = Math.round(ratePerGram * (1 + bufferPercent / 100) * 100) / 100;

    // Save to database
    await prisma.silverRateLog.create({
      data: {
        ratePerGram,
        ratePerKg,
        source: config.SILVER_RATE_API_KEY ? 'API' : 'SIMULATED',
        bufferPercent,
        effectiveRate,
        apiResponse: apiResponse || undefined,
      },
    });

    // Cache in Redis
    const rateData = {
      ratePerGram,
      ratePerKg,
      effectiveRate,
      bufferPercent,
      source: config.SILVER_RATE_API_KEY ? 'API' : 'SIMULATED',
      updatedAt: new Date().toISOString(),
    };

    await redis.setex('silver:current_rate', 900, JSON.stringify(rateData)); // 15 min cache

    // Broadcast to connected clients via Socket.io
    if (io) {
      io.emit('silver-rate-update', rateData);
    }

    logger.info({ ratePerGram, effectiveRate, bufferPercent }, 'Silver rate updated');
  } catch (error) {
    logger.error(error, 'Failed to fetch silver rate');

    // Fallback: keep the last known rate in cache (don't expire it)
    const lastRate = await redis.get('silver:current_rate');
    if (lastRate) {
      await redis.setex('silver:current_rate', 1800, lastRate); // Extend cache 30 min
    }
  }
}

export function startSilverRatePoller() {
  // Fetch immediately on start
  fetchSilverRate();

  // Poll every 15 minutes during market hours (9 AM - 11:30 PM IST, Mon-Fri)
  // For simplicity, poll every 15 min always
  cron.schedule('*/15 * * * *', fetchSilverRate);

  logger.info('Silver rate poller started (every 15 minutes)');
}

export { fetchSilverRate };
