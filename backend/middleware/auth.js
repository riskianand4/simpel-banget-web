const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    // Critical: No fallback for JWT_SECRET - fail fast if not configured
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET not configured');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Token is not valid' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.warn('Token validation failed:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      error: error.message
    });
    res.status(401).json({ 
      success: false,
      error: 'Token is not valid' 
    });
  }
};

// adminAuth removed - admin role deleted

const superAdminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      // Accept both 'super_admin' and 'superadmin' for compatibility
      if (req.user.role !== 'super_admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. Super admin privileges required.' 
        });
      }
      next();
    });
    } catch (error) {
    res.status(401).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
};

// Role normalization helper
const normalizeRole = (role) => {
  if (role === 'superadmin') return 'super_admin';
  return role;
};

// Generic role-based authorization middleware
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      await auth(req, res, () => {
        const userRole = normalizeRole(req.user.role);
        const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
        
        if (!normalizedAllowedRoles.includes(userRole)) {
          return res.status(403).json({ 
            success: false,
            error: 'Access denied. Insufficient privileges.' 
          });
        }
        next();
      });
    } catch (error) {
      res.status(401).json({ 
        success: false,
        error: 'Authentication failed' 
      });
    }
  };
};

module.exports = { auth, superAdminAuth, requireRole };