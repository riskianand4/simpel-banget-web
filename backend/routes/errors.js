const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Rate limiting for error reporting
const rateLimitMap = new Map();
const RATE_LIMIT = 10; // 10 errors per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.firstRequest > RATE_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_WINDOW);

// @desc    Report frontend errors
// @route   POST /api/errors
// @access  Public (no auth required for error reporting)
router.post('/', async (req, res) => {
  // Handle both JSON and text/plain content types (for sendBeacon)
  let errorData;
  
  if (req.headers['content-type'] === 'text/plain') {
    try {
      errorData = JSON.parse(req.body);
    } catch (e) {
      errorData = { message: req.body };
    }
  } else {
    errorData = req.body;
  }

  // Validate the parsed data
  const errors = [];
  if (!errorData.message) {
    errors.push({ msg: 'Error message is required', param: 'message' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Rate limiting
    if (rateLimitMap.has(clientIP)) {
      const data = rateLimitMap.get(clientIP);
      if (now - data.firstRequest < RATE_WINDOW) {
        data.count++;
        if (data.count > RATE_LIMIT) {
          return res.status(429).json({ error: 'Rate limit exceeded' });
        }
      } else {
        rateLimitMap.set(clientIP, { firstRequest: now, count: 1 });
      }
    } else {
      rateLimitMap.set(clientIP, { firstRequest: now, count: 1 });
    }

    const {
      message,
      url,
      userAgent,
      timestamp,
      component,
      stack,
      additionalData,
      userId,
      sessionId
    } = errorData;

    // Log the error (in production, you'd send to external service)
    const errorLog = {
      message,
      url,
      userAgent,
      timestamp: timestamp || new Date().toISOString(),
      component,
      stack,
      additionalData,
      userId,
      sessionId,
      clientIP,
      receivedAt: new Date().toISOString()
    };

    // Log to console (in production, use proper logging service)
    console.error('Frontend Error Report:', JSON.stringify(errorLog, null, 2));

    // In production, you would:
    // - Send to error tracking service (Sentry, LogRocket, etc.)
    // - Store in database for analysis
    // - Alert on critical errors
    // - Aggregate similar errors

    res.json({
      success: true,
      message: 'Error reported successfully'
    });

  } catch (error) {
    console.error('Error handling error report:', error);
    res.status(500).json({ error: 'Failed to process error report' });
  }
});

module.exports = router;