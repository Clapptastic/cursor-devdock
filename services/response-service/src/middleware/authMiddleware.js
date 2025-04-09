/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and adds user information to the request object
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { supabase } = require('../config/database');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

/**
 * Authentication middleware
 * Verifies JWT token and adds user data to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Check if auth header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token is missing'
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if token has been revoked by calling the auth service
      // In a real implementation, this would likely check a token blacklist

      // Get user from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', decoded.sub)
        .single();
        
      if (error || !user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid authentication token'
        });
      }
      
      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin'
      };
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication token has expired'
        });
      }
      
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authentication token'
      });
    }
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Allows unauthenticated requests but adds user data if token is valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Continue without authentication
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', decoded.sub)
        .single();
        
      if (!error && user) {
        // Add user info to request
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          isAdmin: user.role === 'admin'
        };
      }
      
      next();
    } catch (error) {
      // Continue without authentication if token is invalid
      next();
    }
  } catch (error) {
    logger.error(`Optional authentication error: ${error.message}`);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate
}; 