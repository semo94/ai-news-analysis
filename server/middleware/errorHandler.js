/**
 * Global error handling middleware
 */
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Not Found handler - for routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Error handler for parsing JSON
 */
const jsonParseErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.error('JSON parse error', { error: err.message });
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON in request body'
    });
  }
  next(err);
};

/**
 * Global error handler - handles all errors passed to next()
 */
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  
  // Log differently based on severity
  if (statusCode >= 500) {
    logger.error(`Server error: ${err.message}`, { 
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  } else {
    logger.warn(`Client error: ${err.message}`, { 
      path: req.path,
      method: req.method
    });
  }
  
  // Prepare response based on environment
  const response = {
    status: 'error',
    message: statusCode >= 500 && config.server.env === 'production' 
      ? 'Internal Server Error' 
      : err.message
  };
  
  // Add stack trace in development
  if (config.server.env !== 'production' && err.stack) {
    response.stack = err.stack.split('\n');
  }
  
  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  jsonParseErrorHandler,
  globalErrorHandler
};
