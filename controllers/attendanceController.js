const Attendance = require('../models/attendance');


// Check-In Controller
const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("userId",req.user.id);

    // Check if already checked in today
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      user: userId,
      checkIn: { $gte: start, $lte: end },
    });

    if (existing) {
      return res.status(400).json({
        status: 'fail',
        message: 'Already checked in today',
      });
    }

    const attendance = await Attendance.create({
      user: userId,
      checkIn: new Date(),
      location: req.validLocation, // comes from middleware
    });

    res.status(200).json({
      status: 'success',
      message: 'Check-in successful',
      data: attendance,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Check-Out Controller
const  checkOut = async (req, res) => {
   try {
    const userId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      checkIn: { $gte: today },
      checkOut: null,
    });

    if (!attendance) {
      return res.status(404).json({
        status: 'fail',
        message: 'No active check-in found for today',
      });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.status(200).json({
      status: 'success',
      message: 'Check-out successful',
      data: attendance,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const attendanceController = {
    checkIn,
    checkOut
};

module.exports = attendanceController;