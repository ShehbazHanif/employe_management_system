const express = require('express');
const router = express.Router();
// Import middleware
const { authToken, isAdmin, authRateLimit } = require('../middlewares/auth');

// Rate limiting for admin auth endpoints
const adminAuthLimiter = authRateLimit(30 * 60 * 1000, 10); // 3 attempts per 15 minutes (stricter)




//  --------- Admin manage users ................
const userController = require('../controllers/userController');
const { validateUserRegistration } = require("../middlewares/validation")
router.post('/register', adminAuthLimiter, authToken, isAdmin, validateUserRegistration, userController.register);
router.delete("/delete/:id", authToken, isAdmin, userController.deleteUser);
router.get('/get-allUsers', authToken, isAdmin, userController.getAlLUsers);
router.get('/get-filterdUser', authToken, isAdmin, userController.getFilterUser);
router.get('/get-singleUsers/:id', authToken, isAdmin, userController.getSingleUser);



// ----------Admin manage tasks ----------------

const taskController = require('../controllers/taskController');
const { validateTaskPost } = require('../middlewares/validation');
router.post('/post-task', adminAuthLimiter, authToken, isAdmin, validateTaskPost, taskController.postTask);
router.delete('/delete-task/:id', authToken, isAdmin, taskController.deleteTask);
router.patch('/update-task/:id', authToken, isAdmin, taskController.updateTask);
router.get('/get-allTasks', authToken, isAdmin, taskController.getAllTasks);
router.get('/get-filterdTasks', authToken, isAdmin, taskController.getFilterTask);
router.get('/get-singleTask/:id', authToken, isAdmin, taskController.getSingleTask);

//--------------------Admin Generate Attendance Reports and exportAttendanceCSV file-----------
const attendanceController = require('../controllers/attendanceController')
router.get('/attendance-reports', authToken, isAdmin, attendanceController.getAttendanceReports);
router.get('/export-attendance-csv', authToken, isAdmin, attendanceController.exportAttendanceCSV);







module.exports = router;

