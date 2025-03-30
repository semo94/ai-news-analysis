/**
 * Rate limiting middleware
 */
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const config = require('../config');
const redisHelper = require('../utils/redis');
const logger = require('../utils/logger');

// Create basic DDoS protection rate limiter
const basicProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  // Use Redis store for distributed rate limiting
  store: new RedisStore({
    // @ts-ignore (Type definitions might not be updated)
    sendCommand: (...args) => redisHelper.getClient().sendCommand(args)
  }),
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logger.warn('DDoS protection triggered - basic rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });

    return res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again after a minute'
    });
  },
  // Skip route-specific rate limiters from double counting
  skip: (req) => req.skipBasicRateLimit === true
});

// Create basic rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  // Use Redis store for distributed rate limiting
  store: new RedisStore({
    // @ts-ignore (Type definitions might not be updated)
    sendCommand: (...args) => redisHelper.getClient().sendCommand(args)
  }),
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });

    return res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later'
    });
  }
});

// Create more strict limiter for search route (potentially expensive)
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit to 10 searches per 5 minutes
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  // Use Redis store for distributed rate limiting
  store: new RedisStore({
    // @ts-ignore (Type definitions might not be updated)
    sendCommand: (...args) => redisHelper.getClient().sendCommand(args)
  }),
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logger.warn('Search rate limit exceeded', {
      ip: req.ip
    });

    return res.status(429).json({
      status: 'error',
      message: 'Search rate limit exceeded. Maximum 10 searches per 5 minutes allowed.'
    });
  }
});

// Create even stricter limiter for analysis (most expensive)
const analysisLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit to 5 analyses per 10 minutes
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  // Use Redis store for distributed rate limiting
  store: new RedisStore({
    // @ts-ignore (Type definitions might not be updated)
    sendCommand: (...args) => redisHelper.getClient().sendCommand(args)
  }),
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logger.warn('Analysis rate limit exceeded', {
      ip: req.ip
    });

    return res.status(429).json({
      status: 'error',
      message: 'Analysis rate limit exceeded. Maximum 5 analyses per 10 minutes allowed.'
    });
  }
});

// Middleware to mark a request to skip basic rate limiting
// Use this before any route-specific rate limiters
const skipBasicRateLimit = (req, res, next) => {
  req.skipBasicRateLimit = true;
  next();
};

module.exports = {
  basicProtection,
  apiLimiter,
  searchLimiter,
  analysisLimiter,
  skipBasicRateLimit
};