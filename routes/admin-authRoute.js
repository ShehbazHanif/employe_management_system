
const express = require('express');
const router = express.Router();

// Import controllers
const adminAuthController = require('../controllers/admin-authController');

// Import middleware
const { authToken, isAdmin, authRateLimit } = require('../middlewares/auth');


// Rate limiting for admin auth endpoints
const adminAuthLimiter = authRateLimit(15 * 60 * 1000, 10); // 3 attempts per 15 minutes (stricter)


router.post('/login', adminAuthLimiter, adminAuthController.loginAdmin);


module.exports = router;