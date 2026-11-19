const Redis = require('ioredis');
const RedisMock = require('ioredis-mock');
const env = require('./env');

let redisClient = null;
let isMockRedis = false;

function initRedis() {
  if (redisClient) {
    return redisClient;
  }

  if (process.env.NODE_ENV === 'test' || env.USE_MEMORY_DB) {
    console.log('[Redis] Initializing in-memory Redis mock (ioredis-mock)...');
    redisClient = new RedisMock();
    isMockRedis = true;
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log(`[Redis] Connecting to Redis at ${redisUrl}...`);
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: () => null, // Don't infinite loop if redis is down
    });

    client.on('error', (err) => {
      if (!isMockRedis) {
        console.warn(`[Redis] Connection warning: ${err.message}. Switching to in-memory cache.`);
        redisClient = new RedisMock();
        isMockRedis = true;
      }
    });

    client.connect().catch((err) => {
      console.warn(`[Redis] Could not connect to real Redis (${err.message}). Using in-memory Redis.`);
      redisClient = new RedisMock();
      isMockRedis = true;
    });

    redisClient = client;
    return redisClient;
  } catch (err) {
    console.warn(`[Redis] Initialization failed: ${err.message}. Using in-memory mock.`);
    redisClient = new RedisMock();
    isMockRedis = true;
    return redisClient;
  }
}

async function getCachedReports(userId, date) {
  try {
    const client = initRedis();
    const key = `reports:${userId}:${date}`;
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[Redis] Cache get error:', err.message);
  }
  return null;
}

async function setCachedReports(userId, date, data, ttlSeconds = 300) {
  try {
    const client = initRedis();
    const key = `reports:${userId}:${date}`;
    await client.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.warn('[Redis] Cache set error:', err.message);
  }
}

async function invalidateUserReports(userId) {
  try {
    const client = initRedis();
    // Scan and delete all cached reports for this user
    const pattern = `reports:${userId}:*`;
    const keys = await client.keys(pattern);
    if (keys && keys.length > 0) {
      await client.del(...keys);
      console.log(`[Redis] Invalidation: cleared ${keys.length} cached report key(s) for user ID ${userId}`);
    }
  } catch (err) {
    console.warn('[Redis] Cache invalidation error:', err.message);
  }
}

module.exports = {
  initRedis,
  getCachedReports,
  setCachedReports,
  invalidateUserReports,
};
