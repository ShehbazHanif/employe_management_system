const Attendance = require('../models/attendance');
const mongoose = require('mongoose');

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

// user  get attendance Summary (daily ,weekly, monthly)

const getAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ status: 400, message: 'User ID is required' });
    }

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6); // last 7 days
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1); // first day of current month
    monthStart.setHours(0, 0, 0, 0);

    const [todayAttendance, weeklySummary, monthlySummary] = await Promise.all([
      // Today
      Attendance.findOne({
        user: userId,
        checkIn: { $gte: todayStart, $lte: todayEnd },
      }),

      // Weekly Summary
      Attendance.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), checkIn: { $gte: weekStart } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Monthly Summary
      Attendance.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), checkIn: { $gte: monthStart } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.status(200).json({
      status: 200,
      data: {
        today: todayAttendance || null,
        weekly: formatSummary(weeklySummary),
        monthly: formatSummary(monthlySummary),
      },
      message: 'Attendance summary fetched successfully',
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Helper function
function formatSummary(summaryArr) {
  const defaultSummary = { Present: 0, Absent: 0, Leave: 0 };
  summaryArr.forEach(item => {
    defaultSummary[item._id] = item.count;
  });
  return defaultSummary;
}
// admin get To generate Reports
const getAttendanceReports = async (req, res) => {
  try {
    const { userId, status, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};

    if (userId) {
      query.user = new mongoose.Types.ObjectId(userId);
    }

    if (status) {
      query.status = status;
    }

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
    getAttendanceSummary,
    getAttendanceReports,
    exportAttendanceCSV
};

module.exports = attendanceController;