const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { body, validationResult } = require('express-validator');

// Enhanced rate limiting with different tiers
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      // Use IP + User-Agent for more specific rate limiting
      return `${req.ip}-${req.get('User-Agent')?.substring(0, 50) || 'unknown'}`;
    },
    handler: (req, res, next, options) => { 
      console.warn(`Rate limit exceeded for ${req.ip} on ${req.originalUrl}`);
      res.status(options.statusCode).json({ error: message });
    }
  });
};

// Progressive rate limiting
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts, please try again later',
  true // Don't count successful requests
);

const apiRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minute  
  100, // 100 requests per minute
  'Too many requests, please slow down'
);

const strictRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minute
  10, // 10 requests per minute for sensitive operations
  'Rate limit exceeded for sensitive operation'
);

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, 
  delayAfter: 10, 
  maxDelayMs: 20000,
  delayMs: () => 500, 
});

// Input validation middleware
const validateInput = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Log validation errors
    console.warn('Input validation failed:', {
      ip: req.ip,
      url: req.originalUrl,
      errors: errors.array(),
      body: req.body
    });

    res.status(400).json({
      error: 'Invalid input',
      details: errors.array()
    });
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none';"
  );

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

// Request sanitization
const sanitizeRequest = (req, res, next) => {
  // Remove potentially dangerous properties
  if (req.body) {
    delete req.body.__proto__;
    delete req.body.constructor;
    delete req.body.prototype;
  }

  // Limit request body size for specific endpoints
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = req.originalUrl.includes('/upload') ? 10 * 1024 * 1024 : 1024 * 1024; // 10MB for uploads, 1MB for others

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request body too large'
    });
  }

  next();
};

// Suspicious activity detector
const suspiciousActivityDetector = (req, res, next) => {
  const suspicious = [];

  // Check for SQL injection patterns
  const sqlPatterns = /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i;
  const checkForSQL = (value) => {
    if (typeof value === 'string' && sqlPatterns.test(value)) {
      suspicious.push('Potential SQL injection');
    }
  };

  // Check for XSS patterns
  const xssPatterns = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const checkForXSS = (value) => {
    if (typeof value === 'string' && xssPatterns.test(value)) {
      suspicious.push('Potential XSS attempt');
    }
  };

  // Check request body recursively
  const checkObject = (obj, depth = 0) => {
    if (depth > 10) return; // Prevent deep recursion

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'string') {
          checkForSQL(value);
          checkForXSS(value);
        } else if (typeof value === 'object' && value !== null) {
          checkObject(value, depth + 1);
        }
      }
    }
  };

  if (req.body) {
    checkObject(req.body);
  }

  // Check query parameters
  for (const key in req.query) {
    const value = req.query[key];
    if (typeof value === 'string') {
      checkForSQL(value);
      checkForXSS(value);
    }
  }

  if (suspicious.length > 0) {
    console.error('Suspicious activity detected:', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      suspicious: suspicious,
      body: req.body,
      query: req.query
    });

    return res.status(400).json({
      error: 'Request rejected due to security policy'
    });
  }

  next();
};

// Common validation rules
const commonValidations = {
  email: body('email').isEmail().normalizeEmail().isLength({ max: 255 }),
  password: body('password').isLength({ min: 6, max: 128 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  name: body('name').isLength({ min: 1, max: 100 }).trim().escape(),
  id: body('id').isMongoId(),
  phone: body('phone').optional().isMobilePhone(),
  url: body('url').optional().isURL(),
};

module.exports = {
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  speedLimiter,
  validateInput,
  securityHeaders,
  sanitizeRequest,
  suspiciousActivityDetector,
  commonValidations,
  createRateLimit
};