const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Create stricter rate limiting per endpoint type
const createEndpointRateLimit = (windowMs, max, message, skipSuccessfulRequests = true) => {
  return rateLimit({
    windowMs,
    max,
    message: { 
      success: false,
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      return `${req.ip}-${req.get('User-Agent')?.substring(0, 50) || 'unknown'}`;
    },
    handler: (req, res, next, options) => { 
      console.warn(`Rate limit exceeded for ${req.ip} on ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        timestamp: new Date().toISOString()
      });
      res.status(options.statusCode).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Auth endpoints - very strict
const authRateLimit = createEndpointRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts. Please try again in 15 minutes.',
  true // Don't count successful requests
);

// API endpoints - OPTIMIZED - more lenient for system endpoints
const apiRateLimit = createEndpointRateLimit(
  1 * 60 * 1000, // 1 minute  
  120, // 120 requests per minute (increased from 60 for better performance)
  'API rate limit exceeded. Please slow down your requests.'
);

// Sensitive operations - very strict
const sensitiveRateLimit = createEndpointRateLimit(
  5 * 60 * 1000, // 5 minutes
  3, // 3 requests per 5 minutes
  'Rate limit exceeded for sensitive operation. Please wait 5 minutes.'
);

// Admin operations - strict
const adminRateLimit = createEndpointRateLimit(
  1 * 60 * 1000, // 1 minute
  30, // 30 requests per minute
  'Admin rate limit exceeded. Please slow down.'
);

// Progressive slowdown DISABLED - causing performance issues
const progressiveSlowdown = (req, res, next) => {
  // Skip slowdown entirely for better performance
  next();
};

// Endpoint-specific rate limiting middleware - OPTIMIZED
const endpointRateLimits = {
  '/api/auth/login': authRateLimit,
  '/api/auth/register': sensitiveRateLimit,
  '/api/auth/change-password': sensitiveRateLimit,
  '/api/users': adminRateLimit,
  '/api/security': adminRateLimit,
  // More lenient for system endpoints that are frequently accessed
  '/api/system/metrics': createEndpointRateLimit(1 * 60 * 1000, 200, 'System metrics rate limit exceeded.'),
  '/api/system/health': createEndpointRateLimit(1 * 60 * 1000, 200, 'System health rate limit exceeded.'),
  '/api/system/activities': createEndpointRateLimit(1 * 60 * 1000, 100, 'System activities rate limit exceeded.'),
  '/api/system/alerts': createEndpointRateLimit(1 * 60 * 1000, 200, 'System alerts rate limit exceeded.'),
  '/api/system/locations': createEndpointRateLimit(1 * 60 * 1000, 200, 'System locations rate limit exceeded.'),
  '/api/auth/verify': createEndpointRateLimit(1 * 60 * 1000, 200, 'Auth verify rate limit exceeded.'),
  '/api/system': adminRateLimit, // fallback for other system endpoints
  'default': apiRateLimit
};

const applyEndpointRateLimit = (req, res, next) => {
  const endpoint = req.route?.path || req.path;
  const baseEndpoint = endpoint.split('/').slice(0, 3).join('/'); // Get /api/resource pattern
  
  const rateLimit = endpointRateLimits[endpoint] || 
                   endpointRateLimits[baseEndpoint] || 
                   endpointRateLimits.default;
  
  return rateLimit(req, res, next);
};

module.exports = {
  authRateLimit,
  apiRateLimit,
  sensitiveRateLimit,
  adminRateLimit,
  progressiveSlowdown,
  applyEndpointRateLimit,
  endpointRateLimits
};