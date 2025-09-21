// Standardized error response handler
const createErrorResponse = (error, statusCode = 500, req = null) => {
  const response = {
    success: false,
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  };

  // Add request ID for tracking if available
  if (req && req.id) {
    response.requestId = req.id;
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.details = error.details || null;
  }

  // Log error details
  console.error('Error Response:', {
    statusCode,
    message: error.message,
    stack: error.stack,
    url: req?.originalUrl,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: response.timestamp
  });

  return { statusCode, response };
};

// Standard error responses
const errorResponses = {
  validation: (errors, req = null) => {
    return createErrorResponse({
      message: 'Validation failed',
      details: errors
    }, 400, req);
  },
  
  authentication: (message = 'Authentication failed', req = null) => {
    return createErrorResponse({
      message
    }, 401, req);
  },
  
  authorization: (message = 'Access denied. Insufficient privileges.', req = null) => {
    return createErrorResponse({
      message
    }, 403, req);
  },
  
  notFound: (resource = 'Resource', req = null) => {
    return createErrorResponse({
      message: `${resource} not found`
    }, 404, req);
  },
  
  conflict: (message = 'Resource already exists', req = null) => {
    return createErrorResponse({
      message
    }, 409, req);
  },
  
  rateLimit: (retryAfter = 60, req = null) => {
    return createErrorResponse({
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter
    }, 429, req);
  },
  
  server: (error, req = null) => {
    return createErrorResponse(error, 500, req);
  }
};

// Middleware to standardize all error responses
const standardErrorHandler = (error, req, res, next) => {
  let response;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    response = errorResponses.validation(Object.values(error.errors).map(err => err.message), req);
  } else if (error.name === 'CastError') {
    response = errorResponses.validation(['Invalid resource ID format'], req);
  } else if (error.code === 11000) {
    response = errorResponses.conflict('Resource already exists with this identifier', req);
  } else if (error.statusCode) {
    response = createErrorResponse(error, error.statusCode, req);
  } else {
    response = errorResponses.server(error, req);
  }

  res.status(response.statusCode).json(response.response);
};

module.exports = {
  createErrorResponse,
  errorResponses,
  standardErrorHandler
};