/**
 * Article parser service
 */
const Parser = require('@postlight/parser');
const config = require('../config');
const logger = require('../utils/logger');
const redisHelper = require('../utils/redis');

/**
 * Parse an article from a URL
 * @param {string} url - URL to parse
 * @returns {Promise<string>} - Parsed article content
 */
const parseArticle = async (url) => {
  const cacheKey = `parse:${url}`;
  
  try {
    // Try to get from cache first
    const cachedResult = await redisHelper.get(cacheKey);
    if (cachedResult) {
      logger.debug('Parsed article retrieved from cache', { url });
      return cachedResult;
    }
    
    // Otherwise parse the article
    logger.info('Parsing article', { url });
    
    const response = await Parser.parse(url, { contentType: 'text' });
    
    if (!response || !response.content) {
      throw new Error('Failed to parse article content');
    }
    
    const content = response.content.trim();
    
    // Cache the result
    await redisHelper.set(cacheKey, content, config.cache.parser);
    
    return content;
  } catch (error) {
    logger.error('Error parsing article', { 
      url, 
      error: error.message 
    });
    
    throw new Error(`Error parsing article: ${error.message}`);
  }
};

/**
 * Format article metadata with content
 * @param {Object} article - Article metadata
 * @param {string} content - Article content
 * @returns {string} - Formatted article
 */
const formatArticleWithContent = (article, content) => {
  return `
    Publisher: ${article.publisher || 'Unknown'}\n
    Date: ${article.publishedAt || 'Unknown'}\n
    Author: ${article.author || 'Unknown'}\n
    Title: ${article.title || 'Untitled'}\n
    URL: ${article.url || ''}\n
    Article: ${content || 'No content available'}
  `;
};

module.exports = {
  parseArticle,
  formatArticleWithContent
};
