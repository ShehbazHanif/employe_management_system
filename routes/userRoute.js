const express = require('express');
const router = express.Router();
// Import middleware
const { authToken, authRateLimit } = require('../middlewares/auth');

// Rate limiting for admin auth endpoints
const adminAuthLimiter = authRateLimit(15 * 60 * 1000, 10); // 3 attempts per 15 minutes (stricter)

// userController
const userController = require('../controllers/userController');

// route login user
router.post('/login',adminAuthLimiter ,userController.login);

// route to get current user profile

router.get('/profile',userController.getUserProfile);


module.exports = router;
