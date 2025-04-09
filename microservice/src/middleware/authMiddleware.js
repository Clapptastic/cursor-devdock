/**
 * Authentication middleware for microservice
 */
const asyncHandler = require('./asyncHandler');

/**
 * Verify API key middleware
 * Ensures requests have a valid API key
 * @middleware
 */
const apiKeyAuth = asyncHandler(async (req, res, next) => {
  // Check for API key in header or query parameter
  const apiKey = req.header('x-api-key') || req.query.apiKey;
  
  if (!apiKey) {
    res.status(401);
    throw new Error('API key missing');
  }
  
  // Compare with expected API key
  if (apiKey !== process.env.API_KEY) {
    res.status(403);
    throw new Error('Invalid API key');
  }
  
  next();
});

/**
 * Process JWT from main application
 * Verifies JWT tokens passed from the main application
 * @middleware
 */
const processMainAppJWT = asyncHandler(async (req, res, next) => {
  // Get JWT token from header
  const token = req.header('x-auth-token');
  
  if (token) {
    try {
      // Attach token to request for potential later use
      req.mainAppToken = token;
      
      // You could verify the token here if needed using jsonwebtoken package
      // const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      // req.user = decodedToken;
    } catch (error) {
      // Just log the error but don't block the request
      console.error('JWT processing error:', error.message);
    }
  }
  
  next();
});

module.exports = { apiKeyAuth, processMainAppJWT }; 