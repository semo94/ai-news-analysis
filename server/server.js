/**
 * Main server application
 */
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');

// Import config and utilities
const config = require('./config');
const logger = require('./utils/logger');
const redis = require('./utils/redis');

// Import middleware
const { basicProtection } = require('./middleware/rateLimit');
const { 
  notFoundHandler, 
  jsonParseErrorHandler, 
  globalErrorHandler 
} = require('./middleware/errorHandler');

// Import routes
const apiRoutes = require('./routes/api');
const healthRoutes = require('./routes/health');

// Import queue
const analysisQueue = require('./queue/analysisQueue');

// Initialize Express app
const app = express();

// Apply middleware
app.use(cors(config.server.corsOptions));
app.use(helmet()); // Security headers
app.use(compression()); // Response compression
app.use(express.json({ limit: '1mb' })); // JSON body parser with size limit
app.use(morgan('combined', { stream: logger.stream })); // HTTP request logging

// Apply basic DDoS protection to all routes
app.use(basicProtection);

// NOTE: Rate limiting is applied to individual routes in the route handlers
// Do not apply global rate limiting to prevent double counting

// Set up routes
app.use('/api', apiRoutes);
app.use('/health', healthRoutes);

// Serve static files from React build folder
if (config.server.env === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  // Catch-all route to serve React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// JSON parse error handler
app.use(jsonParseErrorHandler);

// 404 handler for routes that don't exist
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Start the server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.server.env} mode on port ${PORT}`);
});

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  // Close server first (stop accepting new requests)
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  try {
    // Close queue
    await analysisQueue.closeQueue();
    
    // Close Redis connection
    await redis.disconnect();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason: reason.toString(), stack: reason.stack });
  process.exit(1);
});

module.exports = server; // Export server for testing purposes