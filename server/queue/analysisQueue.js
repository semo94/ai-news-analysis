/**
 * Article analysis job queue
 */
const Queue = require('bull');
const config = require('../config');
const logger = require('../utils/logger');
const redisHelper = require('../utils/redis');
const openaiService = require('../services/openai');

// Create queue
const analysisQueue = new Queue('article-analysis', {
  redis: config.redis.url,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: 100 // Keep the last 100 failed jobs
  }
});

// Process queue jobs
analysisQueue.process(async (job) => {
  const { taskId, content } = job.data;
  logger.info(`Processing analysis task ${taskId}`, { jobId: job.id });
  
  try {
    // Run the analysis
    const result = await openaiService.analyzeArticle(content);
    
    // Store the result in Redis
    await redisHelper.set(`task:${taskId}`, result, config.cache.analysis);
    
    logger.info(`Completed analysis task ${taskId}`);
    return { taskId, status: 'completed' };
  } catch (error) {
    logger.error(`Error processing analysis task ${taskId}`, { 
      error: error.message, 
      jobId: job.id 
    });
    
    // Store the error in Redis so it can be retrieved by the client
    await redisHelper.set(`task:${taskId}`, {
      error: true,
      message: error.message
    }, config.cache.analysis);
    
    throw error; // Rethrow to mark the job as failed
  }
});

// Handle events
analysisQueue.on('completed', (job, result) => {
  logger.info('Job completed successfully', { 
    jobId: job.id,
    taskId: result.taskId
  });
});

analysisQueue.on('failed', (job, error) => {
  logger.error('Job failed', { 
    jobId: job.id,
    taskId: job.data.taskId,
    error: error.message,
    attempts: job.attemptsMade
  });
});

analysisQueue.on('error', (error) => {
  logger.error('Queue error', { error: error.message });
});

/**
 * Add an analysis job to the queue
 * @param {string} taskId - Unique task ID
 * @param {string} content - Article content to analyze
 * @returns {Promise<Object>} - Job object
 */
const addAnalysisJob = async (taskId, content) => {
  try {
    const job = await analysisQueue.add({
      taskId,
      content
    });
    
    logger.info(`Added analysis task ${taskId} to queue`, { jobId: job.id });
    return job;
  } catch (error) {
    logger.error(`Error adding task ${taskId} to queue`, { error: error.message });
    throw new Error(`Failed to queue analysis: ${error.message}`);
  }
};

/**
 * Get analysis task status
 * @param {string} taskId - Task ID to check
 * @returns {Promise<Object>} - Task status and result
 */
const getAnalysisStatus = async (taskId) => {
  try {
    // Check if result exists in Redis
    const result = await redisHelper.get(`task:${taskId}`);
    
    if (result) {
      // Check if it's an error result
      if (result.error) {
        return {
          status: 'failed',
          error: result.message
        };
      }
      
      // Success case
      return {
        status: 'completed',
        result
      };
    }
    
    // Check if job exists in queue
    const job = await analysisQueue.getJob(taskId);
    
    if (!job) {
      return { status: 'not_found' };
    }
    
    // Get job state
    const state = await job.getState();
    
    return {
      status: state,
      jobId: job.id
    };
  } catch (error) {
    logger.error(`Error checking status for task ${taskId}`, { error: error.message });
    throw new Error(`Failed to check analysis status: ${error.message}`);
  }
};

/**
 * Gracefully shut down the queue
 */
const closeQueue = async () => {
  try {
    await analysisQueue.close();
    logger.info('Analysis queue closed');
  } catch (error) {
    logger.error('Error closing analysis queue', { error: error.message });
  }
};

module.exports = {
  addAnalysisJob,
  getAnalysisStatus,
  closeQueue
};
