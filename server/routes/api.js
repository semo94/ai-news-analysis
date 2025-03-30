/**
 * API routes
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  validateSearchInput,
  validateUrlInput,
  validateAnalysisInput,
  validateTaskId
} = require('../middleware/validation');
const {
  searchLimiter,
  analysisLimiter,
  skipBasicRateLimit
} = require('../middleware/rateLimit');
const newsService = require('../services/newsApi');
const parserService = require('../services/parser');
const analysisQueue = require('../queue/analysisQueue');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   POST /api/search
 * @desc    Search for articles
 * @access  Public
 */
router.post('/search', [skipBasicRateLimit, searchLimiter, validateSearchInput], async (req, res, next) => {
  try {
    const { query } = req.body;

    logger.info('Processing search request', { query });

    // Get search results from News API
    const searchResults = await newsService.searchArticles(query);

    // Format articles
    const formattedArticles = newsService.formatArticles(searchResults.articles);

    return res.json({
      status: 'success',
      articles: formattedArticles,
      totalResults: searchResults.totalResults
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/parse
 * @desc    Parse an article from a URL
 * @access  Public
 */
router.get('/parse', validateUrlInput, async (req, res, next) => {
  try {
    const { url } = req.query;

    logger.info('Processing parse request', { url });

    // Parse the article
    const content = await parserService.parseArticle(url);

    return res.json(content);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/start-analysis
 * @desc    Start article analysis
 * @access  Public
 */
router.post('/start-analysis', [skipBasicRateLimit, analysisLimiter, validateAnalysisInput], async (req, res, next) => {
  try {
    const { content } = req.body;
    const taskId = uuidv4();

    logger.info('Starting analysis task', { taskId });

    // Add to analysis queue
    await analysisQueue.addAnalysisJob(taskId, content);

    return res.json({
      status: 'success',
      taskId,
      message: 'Analysis task started'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/check-analysis/:taskId
 * @desc    Check status of an analysis task
 * @access  Public
 */
router.get('/check-analysis/:taskId', validateTaskId, async (req, res, next) => {
  try {
    const { taskId } = req.params;

    logger.debug('Checking analysis task status', { taskId });

    // Get task status
    const status = await analysisQueue.getAnalysisStatus(taskId);

    return res.json(status);
  } catch (error) {
    next(error);
  }
});

module.exports = router;