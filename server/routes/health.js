/**
 * Health check routes
 */
const express = require('express');
const os = require('os');
const { version } = require('../../package.json');
const redis = require('../utils/redis');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with system info
 * @access  Public
 */
router.get('/detailed', async (req, res) => {
  try {
    // Check Redis connection
    let redisStatus = 'ok';
    try {
      await redis.get('health-check');
    } catch (err) {
      redisStatus = 'error';
      logger.error('Redis health check failed', { error: err.message });
    }
    
    // System information
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    return res.status(200).json({
      status: 'ok',
      version,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime)
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        cpus: os.cpus().length,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
        }
      },
      process: {
        pid: process.pid,
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external)
        }
      },
      dependencies: {
        redis: redisStatus
      }
    });
  } catch (error) {
    logger.error('Health check error', { error: error.message });
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving health information',
      error: error.message
    });
  }
});

/**
 * Format uptime in days, hours, minutes, seconds
 * @param {number} seconds - Uptime in seconds
 * @returns {string} - Formatted uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} - Formatted bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
