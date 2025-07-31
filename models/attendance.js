const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkIn: Date,
  checkOut: Date,
   status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave'],
    default: 'Absent',
  },
  location: {
    lat: Number,
    lng: Number,
  },
});

module.exports = mongoose.model('Attendance', attendanceSchema);
