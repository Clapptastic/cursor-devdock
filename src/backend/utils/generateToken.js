/**
 * JWT token generation utility for Supabase
 * Generates authentication tokens compatible with Supabase Auth
 */
const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for user authentication
 * 
 * @param {string} userId - User ID
 * @param {Object} customClaims - Custom claims to include in the token
 * @returns {string} JWT token
 */
const generateToken = (userId, customClaims = {}) => {
  // Set default expiration time from env or use 30 days
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  
  // Create JWT payload
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    ...customClaims
  };
  
  // Sign token with secret
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verify a JWT token and return the decoded payload
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token: ' + error.message);
  }
};

/**
 * Generate refresh token for long-term authentication
 * 
 * @param {string} userId - User ID
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  // Refresh tokens have longer expiration (90 days)
  const expiresIn = '90d';
  
  // Create JWT payload with refresh token flag
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    type: 'refresh'
  };
  
  // Sign token with secret
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
}; 