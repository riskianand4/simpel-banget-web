const NodeCache = require('node-cache');

// Create cache instances for different data types
const systemCache = new NodeCache({ 
  stdTTL: 30, // 30 seconds for system metrics
  checkperiod: 10,
  useClones: false
});

const userCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes for user data
  checkperiod: 60,
  useClones: false
});

const staticCache = new NodeCache({ 
  stdTTL: 3600, // 1 hour for static data like roles
  checkperiod: 300,
  useClones: false
});

// Cache keys
const CACHE_KEYS = {
  SYSTEM_METRICS: 'system_metrics',
  SYSTEM_HEALTH: 'system_health',
  SYSTEM_ALERTS: 'system_alerts',
  SYSTEM_LOCATIONS: 'system_locations',
  USER_ROLES: 'user_roles',
  USER_STATS: 'user_stats',
  ADMIN_ACTIVITIES: 'admin_activities'
};

// Performance cache middleware
const cacheMiddleware = (cacheInstance, keyGenerator, ttl = null) => {
  return (req, res, next) => {
    const key = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;
    const cachedData = cacheInstance.get(key);

    if (cachedData) {
      // Add cache headers
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, max-age=30');
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache the response
    res.json = (data) => {
      if (res.statusCode === 200 && data && data.success) {
        if (ttl) {
          cacheInstance.set(key, data, ttl);
        } else {
          cacheInstance.set(key, data);
        }
      }
      res.set('X-Cache', 'MISS');
      res.set('Cache-Control', 'public, max-age=30');
      return originalJson(data);
    };

    next();
  };
};

// Cache invalidation helpers
const invalidateCache = {
  system: () => {
    systemCache.flushAll();
    console.log('System cache invalidated');
  },
  users: () => {
    userCache.flushAll();
    console.log('User cache invalidated');
  },
  all: () => {
    systemCache.flushAll();
    userCache.flushAll();
    staticCache.flushAll();
    console.log('All caches invalidated');
  }
};

// Batch database operations helper
const batchDatabaseOperations = async (operations) => {
  const startTime = Date.now();
  try {
    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;
    console.log(`Batch DB operations completed in ${duration}ms`);
    return results;
  } catch (error) {
    console.error('Batch DB operations failed:', error);
    throw error;
  }
};

module.exports = {
  systemCache,
  userCache,
  staticCache,
  CACHE_KEYS,
  cacheMiddleware,
  invalidateCache,
  batchDatabaseOperations
};