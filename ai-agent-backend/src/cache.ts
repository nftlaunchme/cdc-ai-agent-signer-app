// src/cache.ts

import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL, // e.g., 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

export default redisClient;
