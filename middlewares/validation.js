const { AppError } = require('./errorHandler');

// Validation helper functions
const isValidPhone = (phone) => {
  return /^[0-9+()-\s]{10,15}$/.test(phone);
};

const isValidEmail = (email) => {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

const isValidUrl = (url) => {
  return /^https?:\/\/.+/i.test(url);
};

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// User registration validation
const validateUserRegistration = (req, res, next) => {
  const {
    name,
    email,
    phone,
    department,
    designation,
    password
  } = req.body;

  if (!name || name.trim().length === 0) {
    return next(new AppError('Name is required', 400));
  }

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  if (!isValidEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  if (!isValidPhone(phone)) {
    return next(new AppError('Please provide a valid phone number', 400));
  }

  if (!department) {
    return next(new AppError('Department is required', 400));
  }

  if (!designation) {
    return next(new AppError('Designation is required', 400));
  }

  if (!password || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  next();
};


// User profile update validation
const validateUserProfileUpdate = (req, res, next) => {
  const { name, profileImageUrl } = req.body;

  if (name && (name.trim().length < 2 || name.trim().length > 100)) {
    return next(new AppError('Name must be between 2 and 100 characters', 400));
  }

  if (profileImageUrl && !isValidUrl(profileImageUrl)) {
    return next(new AppError('Profile image must be a valid URL', 400));
  }

  next();
};

// Task creation validation
const validateTaskPost = (req, res, next) => {
  const {
    title,
    assignedTo,
    status,
    priority,
    dueDate,
  } = req.body;

  // Title validation
  if (!title || title.trim().length === 0) {
    return next(new AppError('Task title is required', 400));
  }


  // At least assignedTo or assignedTeam must be provided
  if ((!assignedTo || assignedTo.length === 0) && !assignedTeam) {
    return next(new AppError('Task must be assigned to users or a team', 400));
  }


  // Validate status enum
  const validStatuses = ['Pending', 'Progress', 'Complete', 'Overdue'];
  if (status && !validStatuses.includes(status)) {
    return next(new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
  }

  // Validate priority enum
  const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
  if (priority && !validPriorities.includes(priority)) {
    return next(new AppError(`Priority must be one of: ${validPriorities.join(', ')}`, 400));
  }

  // Validate dueDate
  if (!dueDate || isNaN(Date.parse(dueDate))) {
    return next(new AppError('Valid dueDate is required', 400));
  }

  next();
};




// Ad creation validation (Admin only)


// Admin creation validation
const validateAdminCreation = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    return next(new AppError('Admin name must be between 2 and 100 characters', 400));
  }

  if (!email || !isValidEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  if (!password || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  next();
};

// Pagination validation
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  req.pagination = {
    page: Math.max(1, parseInt(page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit) || 20))
  };

  next();
};

// ObjectId validation middleware
const validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  
  if (!id || !isValidObjectId(id)) {
    return next(new AppError(`Invalid ${paramName}`, 400));
  }
  
  next();
};

module.exports = {
  validateUserRegistration,
  validateTaskPost,
  validateUserProfileUpdate,
  validateAdminCreation,
  validatePagination,
  validateObjectId
}; 