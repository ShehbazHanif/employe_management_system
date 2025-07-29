const express = require('express');
const router = express.Router();
// Import middleware
const { authToken, isAdmin, authRateLimit } = require('../middlewares/auth');

// Rate limiting for admin auth endpoints
const adminAuthLimiter = authRateLimit(15 * 60 * 1000, 10); // 3 attempts per 15 minutes (stricter)

// userController
const userController = require('../controllers/userController');

router.post('/register',adminAuthLimiter ,authToken ,isAdmin , userController.register);

module.exports = router;

