const express = require('express');
const router = express.Router();
// Import middleware
const { authToken, authRateLimit } = require('../middlewares/auth');

// Rate limiting for admin auth endpoints
const adminAuthLimiter = authRateLimit(15 * 60 * 1000, 10); // 3 attempts per 15 minutes (stricter)

// userController
const userController = require('../controllers/userController');
const taskController = require('../controllers/taskController');
const attendanceController = require('../controllers/attendanceController');

// route login user
router.post('/login',adminAuthLimiter ,userController.login);

// route to get current user profile

router.get('/profile',userController.getUserProfile);

// route to get latest task
router.get('/get/latest-task',authToken,userController.getLatestTask);

//route to get all tasks
router.get('/get/all-task',authToken,userController.getAllTasks);

// route to update task status
router.patch('/update-task/:id',taskController.updateTask);

//route to  user  get attendance Summary and working Hours , Break Time and OverTime (daily ,weekly, monthly)

router.get('/attendance-summary', authToken, attendanceController.getAttendanceAndWorkingSummary);


module.exports = router;
