/**
 * News API service
 */
const axios = require('axios');
const querystring = require('querystring');
const config = require('../config');
const logger = require('../utils/logger');
const redisHelper = require('../utils/redis');

// Create an axios instance with defaults
const newsApiClient = axios.create({
  baseURL: config.apis.news.baseUrl,
  timeout: config.apis.news.timeout,
  headers: {
    'X-Api-Key': config.apis.news.apiKey
  }
});

/**
 * Search for articles using News API
 * @param {string} query - Search query
 * @returns {Promise<Object>} - Search results
 */
const searchArticles = async (query) => {
  const cacheKey = `search:${query}`;
  
  try {
    // Try to get from cache first
    const cachedResult = await redisHelper.get(cacheKey);
    if (cachedResult) {
      logger.debug('Search results retrieved from cache', { query });
      return cachedResult;
    }
    
    // Otherwise fetch from API
    logger.info('Fetching search results from News API', { query });
    const encodedQuery = querystring.escape(query);
    
    const response = await newsApiClient.get('/everything', {
      params: {
        q: encodedQuery,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: config.apis.news.pageSize
      }
    });
    
    // Cache the result
    await redisHelper.set(cacheKey, response.data, config.cache.search);
    
    return response.data;
  } catch (error) {
    logger.error('Error searching articles', { 
      query, 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Specific error handling for common cases
    if (error.response) {
      // The request was made and the server responded with a non-2xx status
      if (error.response.status === 401) {
        throw new Error('Invalid News API key');
      } else if (error.response.status === 429) {
        throw new Error('News API rate limit exceeded');
      } else {
        throw new Error(`News API error: ${error.response.data?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('News API request timed out');
    } else {
      throw new Error(`Error searching articles: ${error.message}`);
    }
  }
};

/**
 * Format article data for frontend consumption
 * @param {Array<Object>} articles - Raw articles from News API
 * @returns {Array<Object>} - Formatted articles
 */
const formatArticles = (articles) => {
  if (!articles || !Array.isArray(articles)) return [];
  
  return articles.map((article, index) => ({
    id: index,
    title: article.title,
    url: article.url,
    author: article.author || 'Unknown',
    publisher: article.source?.name || 'Unknown Source',
    publishedAt: article.publishedAt,
    description: article.description
  }));
};

module.exports = {
  searchArticles,
  formatArticles
};
