/**
 * Authentication middleware for verifying JWT tokens from Supabase
 */
const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const { getDB } = require('../config/database');

/**
 * Protect routes - Verify user is authenticated
 * @middleware
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const supabase = getDB();
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', decodedToken.sub)
        .single();
        
      if (error || !userData) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }
      
      // Attach user to request object
      req.user = userData;
      
      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      res.status(401);
      throw new Error('Not authorized, invalid token');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

/**
 * Admin middleware - Verify user is an admin
 * @middleware
 */
const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
});

module.exports = { protect, admin }; 