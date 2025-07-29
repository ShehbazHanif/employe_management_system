require('dotenv').config();
const jwt = require('jsonwebtoken');
// const User = require('../models/auth');
const Admin = require('../models/admin');
const User = require('../models/user')
const { AppError ,catchAsync} = require('../middlewares/errorHandler');

// Protect routes - verify JWT token

const authToken = catchAsync(async (req, res, next) => {
  let token;

  // 1. Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2. Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Find user or admin based on role
  let currentUser = null;

  if (decoded.role === 'admin') {
    currentUser = await Admin.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('Admin account not found or has been removed.', 401));
    }
  } else {
    currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('User account not found or has been removed.', 401));
    }
  }

  // Optional: You can attach the role too
  req.user = currentUser;
  req.user.role = decoded.role;

  next();
});

// Restrict to certain roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || !['admin'].includes(req.user.role)) {
    return next(new AppError('Access denied. Admins only.', 403));
  }
  next();
};



// Check admin permissions for specific resource and action
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (req.user.role === 'user') {
      return next(new AppError('Access denied. Admins only.', 403));
    }

    if (!req.user.hasPermission || !req.user.hasPermission(resource, action)) {
      return next(new AppError(`You don't have permission to ${action} ${resource}`, 403));
    }
    
    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      
      let currentUser;
      if (decoded.role === 'admin' || decoded.role === 'super_admin' || decoded.role === 'moderator') {
        currentUser = await Admin.findById(decoded.id).select('+isActive');
      } else {
        currentUser = await User.findById(decoded.id).select('+isActive');
      }
      
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
      }
    } catch (err) {
      // Token is invalid, but we continue without authentication
      // This allows anonymous access while still providing user context if available
    }
  }

  next();
});

// Rate limiting for authentication endpoints
const authRateLimit = (windowMs, max) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userData = attempts.get(key);
    
    if (now > userData.resetTime) {
      userData.count = 1;
      userData.resetTime = now + windowMs;
      return next();
    }
    
    if (userData.count >= max) {
      return next(new AppError('Too many authentication attempts. Please try again later.', 429));
    }
    
    userData.count++;
    next();
  };
};

module.exports = {
  authToken,
  restrictTo,
  isAdmin,
  checkPermission,
  optionalAuth,
  authRateLimit
};

