const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
  },
  designation: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['employee', 'manager', 'hr'],
    default: 'employee',
  },
 location: {
     type:String,
    },
  profileImageUrl: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('User', userSchema);
