const ApiKey = require('../models/ApiKey');
const ApiRequestLog = require('../models/ApiRequestLog');

// Enhanced API key authentication middleware
const apiKeyAuth = (requiredPermissions = []) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    let logData = {
      timestamp: new Date(),
      method: req.method,
      endpoint: req.originalUrl || req.url,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown',
      requestSize: parseInt(req.get('content-length')) || 0
    };

    try {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      
      if (!apiKey) {
        const responseTime = Date.now() - startTime;
        
        // Log failed attempt
        setImmediate(() => {
          ApiRequestLog.logRequest({
            ...logData,
            statusCode: 401,
            responseTime,
            apiKey: null,
            apiKeyName: 'Missing API Key',
            errorType: 'MISSING_API_KEY',
            errorMessage: 'No API key provided'
          });
        });

        return res.status(401).json({ 
          error: 'API key required',
          message: 'Please provide a valid API key in the x-api-key header'
        });
      }

      // Find the API key in database
      const keyRecord = await ApiKey.findByKey(apiKey);
      
      if (!keyRecord) {
        const responseTime = Date.now() - startTime;
        
        // Log invalid API key attempt
        setImmediate(() => {
          ApiRequestLog.logRequest({
            ...logData,
            statusCode: 401,
            responseTime,
            apiKey: apiKey.substring(0, 10) + '...', // Log partial key for security
            apiKeyName: 'Invalid API Key',
            errorType: 'INVALID_API_KEY',
            errorMessage: 'Invalid or expired API key'
          });
        });

        return res.status(401).json({ 
          error: 'Invalid API key',
          message: 'The provided API key is invalid or expired'
        });
      }

      // Check if key is valid (active and not expired)
      if (!keyRecord.isValid) {
        const responseTime = Date.now() - startTime;
        
        // Log expired/inactive key attempt
        setImmediate(() => {
          ApiRequestLog.logRequest({
            ...logData,
            statusCode: 401,
            responseTime,
            apiKey: keyRecord.key?.substring(0, 10) + '...',
            apiKeyId: keyRecord._id,
            apiKeyName: keyRecord.name,
            errorType: 'EXPIRED_API_KEY',
            errorMessage: 'API key inactive or expired'
          });
        });

        return res.status(401).json({ 
          error: 'API key inactive or expired',
          message: 'The API key is either inactive or has expired'
        });
      }

      // Check permissions if required
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.some(permission => 
          keyRecord.hasPermission(permission)
        );
        
        if (!hasPermission) {
          const responseTime = Date.now() - startTime;
          
          // Log insufficient permissions
          setImmediate(() => {
            ApiRequestLog.logRequest({
              ...logData,
              statusCode: 403,
              responseTime,
              apiKey: keyRecord.key?.substring(0, 10) + '...',
              apiKeyId: keyRecord._id,
              apiKeyName: keyRecord.name,
              errorType: 'INSUFFICIENT_PERMISSIONS',
              errorMessage: `Missing permissions: ${requiredPermissions.join(', ')}`
            });
          });

          return res.status(403).json({ 
            error: 'Insufficient permissions',
            message: `This API key does not have the required permissions: ${requiredPermissions.join(', ')}`
          });
        }
      }

      // Log the successful API usage (async, don't block the request)
      setImmediate(() => {
        keyRecord.logUsage(
          req.originalUrl || req.url,
          req.method,
          req.ip || req.connection.remoteAddress,
          req.get('User-Agent') || 'Unknown'
        ).catch(err => {
          console.error('Failed to log API usage:', err);
        });
      });

      // Attach API key info to request
      req.apiKey = keyRecord;
      req.apiKeyPermissions = keyRecord.permissions;
      req.startTime = startTime;
      req.logData = {
        ...logData,
        apiKey: keyRecord.key?.substring(0, 10) + '...',
        apiKeyId: keyRecord._id,
        apiKeyName: keyRecord.name
      };

      next();
    } catch (error) {
      console.error('API Key Auth Error:', error);
      const responseTime = Date.now() - startTime;
      
      // Log authentication error
      setImmediate(() => {
        ApiRequestLog.logRequest({
          ...logData,
          statusCode: 500,
          responseTime,
          apiKey: null,
          apiKeyName: 'System Error',
          errorType: 'SYSTEM_ERROR',
          errorMessage: error.message
        });
      });

      res.status(500).json({ 
        error: 'Authentication error',
        message: 'An error occurred while validating the API key'
      });
    }
  };
};

// Middleware for checking specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey || !req.apiKey.hasPermission(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This operation requires the '${permission}' permission`
      });
    }
    next();
  };
};

// Rate limiting middleware based on API key
const apiKeyRateLimit = () => {
  const requests = new Map(); // In production, use Redis
  
  return (req, res, next) => {
    if (!req.apiKey) {
      return next();
    }

    const keyId = req.apiKey._id.toString();
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const limit = req.apiKey.rateLimit;

    if (!requests.has(keyId)) {
      requests.set(keyId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const keyData = requests.get(keyId);
    
    if (now > keyData.resetTime) {
      // Reset the counter
      keyData.count = 1;
      keyData.resetTime = now + windowMs;
      requests.set(keyId, keyData);
      return next();
    }

    if (keyData.count >= limit) {
      const responseTime = Date.now() - (req.startTime || now);
      
      // Log rate limit exceeded
      setImmediate(() => {
        ApiRequestLog.logRequest({
          ...req.logData,
          statusCode: 429,
          responseTime,
          errorType: 'RATE_LIMITED',
          errorMessage: `Rate limit exceeded: ${limit} requests per hour`
        });
      });

      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Rate limit of ${limit} requests per hour exceeded`,
        resetTime: new Date(keyData.resetTime).toISOString()
      });
    }

    keyData.count++;
    requests.set(keyId, keyData);
    next();
  };
};

// Middleware to log successful API responses
const logSuccessfulResponse = () => {
  return (req, res, next) => {
    if (!req.logData) {
      return next();
    }

    // Capture the original send method
    const originalSend = res.send;
    
    res.send = function(data) {
      const responseTime = Date.now() - (req.startTime || Date.now());
      const responseSize = Buffer.byteLength(data || '', 'utf8');
      
      // Log successful response
      setImmediate(() => {
        ApiRequestLog.logRequest({
          ...req.logData,
          statusCode: res.statusCode,
          responseTime,
          responseSize,
          errorType: res.statusCode < 400 ? 'SUCCESS' : 'CLIENT_ERROR',
          errorMessage: res.statusCode >= 400 ? 'Client error' : null
        });
      });

      // Call the original send method
      return originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  apiKeyAuth,
  requirePermission,
  apiKeyRateLimit,
  logSuccessfulResponse
};