/**
 * API Gateway Service
 * 
 * Entry point for the API Gateway service, which routes requests to appropriate microservices,
 * handles authentication, and implements security measures.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Import middleware if available (mock if not)
let authMiddleware;
try {
  authMiddleware = require('./middleware/authMiddleware');
} catch (error) {
  console.warn('Auth middleware not available, using mock middleware');
  authMiddleware = (req, res, next) => {
    req.user = { id: 'mock-user-id', role: 'user' };
    next();
  };
}

// Load environment variables
require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply security middleware
app.use(helmet());

// Setup CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Request logging
app.use(morgan('combined'));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// Define service routes with error handling and fallbacks
const setupServiceProxy = (path, targetUrl, requireAuth = true) => {
  if (!targetUrl) {
    console.warn(`Service URL not configured for path: ${path}`);
    
    // Create mock endpoint for development
    app.use(`/api${path}`, (req, res) => {
      res.status(200).json({
        status: 'mock',
        message: `Mock response for ${path}`,
        endpoint: req.originalUrl,
        method: req.method,
        requestBody: req.body
      });
    });
    return;
  }

  const middleware = requireAuth ? [authMiddleware] : [];
  
  app.use(`/api${path}`, 
    ...middleware,
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      pathRewrite: {
        [`^/api${path}`]: '',
      },
      onProxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${path}:`, err);
        res.status(502).json({
          status: 'error',
          message: 'Service temporarily unavailable'
        });
      }
    })
  );
};

// Get service URLs from environment with fallbacks for development
const SURVEY_SERVICE_URL = process.env.SURVEY_SERVICE_URL;
const RESPONSE_SERVICE_URL = process.env.RESPONSE_SERVICE_URL;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// Setup proxies to active microservices
setupServiceProxy('/surveys', SURVEY_SERVICE_URL);
setupServiceProxy('/responses', RESPONSE_SERVICE_URL);
setupServiceProxy('/ai', AI_SERVICE_URL);

// Public survey endpoint (no auth required)
if (SURVEY_SERVICE_URL) {
  app.use('/public/survey/:id', createProxyMiddleware({
    target: SURVEY_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/public/survey': '/public/survey',
    }
  }));
} else {
  // Mock public survey endpoint for development
  app.get('/public/survey/:id', (req, res) => {
    res.status(200).json({
      id: req.params.id,
      title: 'Mock Survey',
      description: 'This is a mock survey for development',
      questions: [
        { id: 1, text: 'How would you rate our service?', type: 'rating' },
        { id: 2, text: 'Any additional feedback?', type: 'text' }
      ]
    });
  });
}

// Default handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
    path: req.originalUrl
  });
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API Gateway service running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Services configuration:`);
    console.log(`- Surveys: ${SURVEY_SERVICE_URL || 'MOCK (not configured)'}`);
    console.log(`- Responses: ${RESPONSE_SERVICE_URL || 'MOCK (not configured)'}`);
    console.log(`- AI: ${AI_SERVICE_URL || 'MOCK (not configured)'}`);
  });
}

// Export app for testing
module.exports = app; 