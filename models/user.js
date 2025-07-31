const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, 
    trim: true,
  },
  email: {
    type: String,
    required: true, 
    lowercase: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Employee', 'Manager', 'Hr'],
    default: 'Employee',
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
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('User', userSchema);
