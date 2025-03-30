/**
 * OpenAI service for article analysis
 */
const { Configuration, OpenAIApi } = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

// System prompt for article analysis
const systemPrompt = "Analyze the news article provided below and generate a consistent semantic and sentiment analysis for an end-user of a news aggregator app. Your analysis should include:\n1. Objectivity and neutrality score (0-10 scale): Provide a score for the objectivity and neutrality of the article, where 0 is the least objective/neutral and 10 is the most objective/neutral. Concisely list the reasons that led to this score, using specific examples from the article.\n2. Ideological/political bias detection: List up to 5 tags/labels (max. 5 words each) describing the nature and extent of the bias, indicating the direction of the bias. Provide a concise explanation of the factors contributing to each bias label, using specific examples from the article.\nConsider the following aspects for your analysis:\na. Balance of perspectives\nb. Language and tone\nc. Focus on facts versus opinions\nd. Selective presentation of information\ne. Use of reliable and verifiable sources\n\nAfter your analysis, generate a concise, objective, neutral, and unbiased summary of the article in just a few sentences. \n\nPlease also provide a brief overall assessment of the article, considering both its strengths and weaknesses, and suggest potential ways to improve its objectivity, neutrality, or balance, if necessary.\n\nAnalyze the following news article, keeping in mind its publication date, the author's history, and the outlet's reputation:";

// Create OpenAI configuration
const configuration = new Configuration({
  organization: config.apis.openai.orgId,
  apiKey: config.apis.openai.apiKey,
});

// Initialize OpenAI API
const openai = new OpenAIApi(configuration);

/**
 * Analyze an article with OpenAI
 * @param {string} content - Article content to analyze
 * @returns {Promise<Object>} - Analysis result
 */
const analyzeArticle = async (content) => {
  const maxRetries = config.openaiRetry.maxRetries;
  let delay = config.openaiRetry.initialDelay;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      logger.info(`Analyzing article with OpenAI (attempt ${attempt + 1}/${maxRetries})`);
      
      const response = await openai.createChatCompletion({
        model: config.apis.openai.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content }
        ],
        max_tokens: config.apis.openai.maxTokens,
        n: 1,
        stop: null,
        temperature: config.apis.openai.temperature,
      });
      
      logger.debug('OpenAI analysis completed successfully', {
        modelUsed: config.apis.openai.model,
        promptTokens: response.data.usage?.prompt_tokens,
        completionTokens: response.data.usage?.completion_tokens,
        totalTokens: response.data.usage?.total_tokens
      });
      
      return response.data;
    } catch (error) {
      attempt++;
      
      // Log the error details
      logger.error(`OpenAI API error (attempt ${attempt}/${maxRetries})`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // If we've exhausted all retries, throw the error
      if (attempt >= maxRetries) {
        throw new Error(`OpenAI analysis failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Otherwise wait and retry
      logger.info(`Retrying OpenAI analysis in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay *= 2;
    }
  }
};

module.exports = {
  analyzeArticle
};
