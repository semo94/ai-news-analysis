/**
 * Redis client utility
 */
const { createClient } = require('redis');
const config = require('../config');
const logger = require('./logger');

// Create Redis client
const redisClient = createClient(config.redis.options);

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    logger.info('Redis client connected');
  } catch (error) {
    logger.error('Redis connection error:', error);
    process.exit(1); // Exit with error
  }
})();

// Handle Redis errors
redisClient.on('error', (error) => {
  logger.error('Redis error:', error);
});

// Add some helper methods to make working with Redis easier
const redisHelper = {
  /**
   * Set a value in Redis with expiration
   * @param {string} key - Redis key
   * @param {any} value - Value to store (will be JSON stringified)
   * @param {number} expiry - Expiration time in seconds
   */
  async set(key, value, expiry = null) {
    const stringValue = JSON.stringify(value);
    if (expiry) {
      await redisClient.set(key, stringValue, { EX: expiry });
    } else {
      await redisClient.set(key, stringValue);
    }
  },

  /**
   * Get a value from Redis and parse it as JSON
   * @param {string} key - Redis key
   * @returns {Promise<any>} - Parsed value or null if not found
   */
  async get(key) {
    const value = await redisClient.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      logger.error(`Error parsing Redis value for key ${key}:`, error);
      return value; // Return unparsed value if parsing fails
    }
  },

  /**
   * Delete a key from Redis
   * @param {string} key - Redis key
   */
  async del(key) {
    await redisClient.del(key);
  },

  /**
   * Set expiration on a key
   * @param {string} key - Redis key
   * @param {number} seconds - Expiration time in seconds
   */
  async expire(key, seconds) {
    await redisClient.expire(key, seconds);
  },

  /**
   * Get the raw Redis client
   * @returns {Object} - Redis client
   */
  getClient() {
    return redisClient;
  },

  /**
   * Gracefully disconnect Redis
   */
  async disconnect() {
    try {
      await redisClient.disconnect();
      logger.info('Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis client:', error);
    }
  }
};

module.exports = redisHelper;
