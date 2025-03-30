/**
 * Centralized configuration management
 */
require('dotenv').config();

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    corsOptions: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },
  
  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    options: {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3
    }
  },
  
  // External API configurations
  apis: {
    news: {
      baseUrl: 'https://newsapi.org/v2',
      apiKey: process.env.NEWS_API_KEY,
      timeout: 5000, // 5 seconds
      pageSize: 50
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      orgId: process.env.OPENAI_ORG_ID,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18',
      maxTokens: 1000,
      temperature: 0.7
    }
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // Max requests per window
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Cache configuration
  cache: {
    search: 5 * 60, // 5 minutes in seconds
    parser: 24 * 60 * 60, // 24 hours in seconds
    analysis: 24 * 60 * 60 // 24 hours in seconds
  },
  
  // OpenAI retry configuration
  openaiRetry: {
    maxRetries: 3,
    initialDelay: 1000 // 1 second
  }
};
