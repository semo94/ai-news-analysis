/**
 * Validation middleware for API requests
 */
const logger = require('../utils/logger');

/**
 * Validates search query input
 */
const validateSearchInput = (req, res, next) => {
  const { query } = req.body;
  
  if (!query || typeof query !== 'string' || query.trim() === '') {
    logger.warn('Invalid search query received', { query });
    return res.status(400).json({ 
      status: 'error',
      message: 'Search query must be a non-empty string' 
    });
  }
  
  // If valid, trim the query and pass it on
  req.body.query = query.trim();
  next();
};

/**
 * Validates URL input
 */
const validateUrlInput = (req, res, next) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ 
      status: 'error',
      message: 'URL is required' 
    });
  }
  
  try {
    // Check if URL is valid
    new URL(url);
    next();
  } catch (error) {
    logger.warn('Invalid URL received', { url });
    return res.status(400).json({ 
      status: 'error',
      message: 'Invalid URL format'
    });
  }
};

/**
 * Validates article content for analysis
 */
const validateAnalysisInput = (req, res, next) => {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string' || content.trim() === '') {
    logger.warn('Invalid content for analysis');
    return res.status(400).json({ 
      status: 'error',
      message: 'Content must be a non-empty string'
    });
  }
  
  // If content is too long, reject it
  if (content.length > 50000) {
    logger.warn('Content too long for analysis', { contentLength: content.length });
    return res.status(400).json({
      status: 'error',
      message: 'Content is too long. Maximum 50,000 characters allowed.'
    });
  }
  
  next();
};

/**
 * Validates task ID for checking analysis
 */
const validateTaskId = (req, res, next) => {
  const { taskId } = req.params;
  
  // Basic UUID validation pattern (not perfect but catches most issues)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!taskId || !uuidPattern.test(taskId)) {
    logger.warn('Invalid task ID received', { taskId });
    return res.status(400).json({
      status: 'error',
      message: 'Invalid task ID format'
    });
  }
  
  next();
};

module.exports = {
  validateSearchInput,
  validateUrlInput,
  validateAnalysisInput,
  validateTaskId
};
