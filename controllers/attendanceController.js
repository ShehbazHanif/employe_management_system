const moment = require('moment');
const Attendance = require('../models/attendance');
const mongoose = require('mongoose');
const monent = require("moment")
// Check-In Controller
const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;

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

    // Check current time is before or at 9:30 AM
    const now = new Date();
    const cutoffTime = new Date();
    cutoffTime.setHours(9, 30, 0, 0); // 9:30 AM

    if (now > cutoffTime) {
      return res.status(403).json({
        status: 'fail',
        message: 'Check-in not allowed after 9:30 AM',
      });
    }

    // Proceed with check-in
    const attendance = await Attendance.create({
      user: userId,
      checkIn: now,
      status: 'Present',
      location: req.validLocation, // assumed set in middleware
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
const checkOut = async (req, res) => {
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

// user  get attendance Summary and working Hours , Break Time and OverTime (daily ,weekly, monthly)

// Helper: Calculate working hours and overtime
const getWorkingStats = (attendance) => {
  const breakHours = parseFloat(process.env.BREAK_TIME || 1); // Default 1hr break

  if (!attendance.checkIn || !attendance.checkOut) {
    return { workingHour: 0, overTime: 0 };
  }

  const duration = moment(attendance.checkOut).diff(moment(attendance.checkIn), 'hours', true);
  const workingHour = Math.max(duration - breakHours, 0);
  const overTime = workingHour > 8 ? workingHour - 8 : 0;

  return {
    workingHour: parseFloat(workingHour.toFixed(2)),
    overTime: parseFloat(overTime.toFixed(2)),
    breakTime: breakHours
  };
};

// Format a single attendance with stats
const formatAttendance = (record) => {
  const stats = getWorkingStats(record);
  return {
    checkIn: record.checkIn ? moment(record.checkIn).format("YYYY-MM-DD HH:mm:ss") : null,
    checkOut: record.checkOut ? moment(record.checkOut).format("YYYY-MM-DD HH:mm:ss") : null,
    location: record.location || null,
    status: record.status || null,
    ...stats
  };
};

const getAttendanceAndWorkingSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { range = 'all' } = req.query;

    if (!userId) {
      return res.status(400).json({ status: 400, message: 'User ID is required' });
    }

    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const weekStart = moment().subtract(6, 'days').startOf('day').toDate();
    const monthStart = moment().startOf('month').toDate();

    const data = {};

    if (range === 'daily' || range === 'all') {
      const today = await Attendance.findOne({
        user: userId,
        checkIn: { $gte: todayStart, $lte: todayEnd }
      });
      data.today = today ? formatAttendance(today) : null;
    }

    if (range === 'weekly' || range === 'all') {
      const week = await Attendance.find({
        user: userId,
        checkIn: { $gte: weekStart }
      }).sort({ checkIn: -1 });
      data.weekly = week.map(formatAttendance);
    }

    if (range === 'monthly' || range === 'all') {
      const month = await Attendance.find({
        user: userId,
        checkIn: { $gte: monthStart }
      }).sort({ checkIn: -1 });
      data.monthly = month.map(formatAttendance);
    }

    res.status(200).json({
      status: 200,
      message: `Attendance ${range !== 'all' ? range : ''} summary fetched successfully`,
      data
    });
  } catch (err) {
    console.error('Error in getAttendanceAndWorkingSummary:', err);
    res.status(500).json({ status: 500, message: err.message });
  }
};



// admin get To generate Reports
const getAttendanceReports = async (req, res) => {
  try {
    const { userId,  startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};

    if (userId) {
      query.user = new mongoose.Types.ObjectId(userId);
    }

    // if (status) {
    //   query.status = status;
    // }

    if (startDate && endDate) {
      query.checkIn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get total records (for pagination)
    const total = await Attendance.countDocuments(query);

    // Get paginated records
    const attendances = await Attendance.find(query)
      .populate('user', 'name email')
      .sort({ checkIn: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Aggregation to count each status
    const statusSummary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      Present: 0,
      Absent: 0,
      Leave: 0,
    };

    statusSummary.forEach(item => {
      counts[item._id] = item.count;
    });

    res.status(200).json({
      status: 200,
      data: attendances,
      summary: counts,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
      message: 'Attendance report fetched successfully',
    });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ status: 500, message: err.message });
  }
};

// exportAttendanceCSV

const exportAttendanceCSV = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.checkIn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch records
    const records = await Attendance.find(filter)
      .populate('user', 'name email')
      .lean();

    // Format records for CSV
    const data = records.map(rec => ({
      Name: rec.user?.name || '',
      Email: rec.user?.email || '',
      Status: rec.status,
      CheckIn: rec.checkIn,
      CheckOut: rec.checkOut,
    }));

    // Get count summary
    const summaryAgg = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summaryMap = {
      Present: 0,
      Absent: 0,
      Leave: 0
    };
    summaryAgg.forEach(item => {
      summaryMap[item._id] = item.count;
    });

    // Add blank line + summary rows
    data.push({});
    data.push({ Name: 'Summary', Email: '', Status: '', CheckIn: '', CheckOut: '' });
    data.push({ Name: 'Present', Email: '', Status: summaryMap.Present, CheckIn: '', CheckOut: '' });
    data.push({ Name: 'Absent', Email: '', Status: summaryMap.Absent, CheckIn: '', CheckOut: '' });
    data.push({ Name: 'Leave', Email: '', Status: summaryMap.Leave, CheckIn: '', CheckOut: '' });

    // Generate CSV
    const json2csv = new Parser();
    const csv = json2csv.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('attendance_report.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};





const attendanceController = {
  checkIn,
  checkOut,
  getAttendanceAndWorkingSummary,
  getAttendanceReports,
  exportAttendanceCSV,

};

module.exports = attendanceController;



// for (let i = 1; i <= 30; i++) {

//   const attendance = await Attendance.create({
//     user: "688b3be0801eb80c3969fe14",
//     checkIn: `2025-07-${i} 09:00`,
//     checkOut: `2025-07-${i} 20:00`,
//     status: 'Present',
//     location: {
//       "lat": 33.550512,
//       "lng": 73.0801582
//     }, // assumed set in middleware
//   });

// }