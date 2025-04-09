/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and adds user information to the request object.
 */
const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * Middleware to authenticate requests using JWT tokens.
 * It verifies the token from the Authorization header and adds user data to the request.
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user data to request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      
      // Check if token is revoked by calling the auth service
      // This is important for logout functionality and security
      try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/validate-token`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.valid) {
          return res.status(401).json({
            success: false,
            message: 'Invalid token. Please login again.'
          });
        }
      } catch (error) {
        // If auth service is down, we'll still allow the request 
        // but log the error for monitoring
        console.error('Error validating token with auth service:', error.message);
      }
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

/**
 * Middleware to check if user has required role.
 * Must be used after authenticate middleware.
 * 
 * @param {string|string[]} roles - Required role(s)
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions'
      });
    }
    
    next();
  };
};

module.exports = authenticate;
module.exports.authorize = authorize; 