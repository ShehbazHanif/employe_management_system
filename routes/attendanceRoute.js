const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const verifyLocation = require('../middlewares/verifyLocation');
const { authToken } = require('../middlewares/auth'); 
router.post('/checkin', authToken,verifyLocation, attendanceController.checkIn);
router.post('/checkout', authToken,verifyLocation, attendanceController.checkOut);

module.exports = router;
