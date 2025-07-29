const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Admin name is required'],
    trim: true,
    minLength: 2,
    maxLength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin',
    index: true
  },
  permissions: {
    attendance: {
      read: { type: Boolean, default: true },
      modify: { type: Boolean, default: true }
    },
    tasks: {
      create: { type: Boolean, default: true },
      update: { type: Boolean, default: true },
      delete: { type: Boolean, default: true },
      assign: { type: Boolean, default: true }
    },
    employees: {
      create: { type: Boolean, default: true },
      update: { type: Boolean, default: true },
      deactivate: { type: Boolean, default: true },
      view: { type: Boolean, default: true }
    },
    analytics: {
      view: { type: Boolean, default: true }
    }
  },
  profileImageUrl: {
    type: String,
    default: '',
    validate: {
      validator: v => !v || /^https?:\/\/.+/i.test(v),
      message: 'Must be a valid image URL'
    }
  },
  isActive: { type: Boolean, default: true, index: true },
  lastLogin: { type: Date, default: null },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: Date.now },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null }
}, {
  timestamps: true
});


module.exports = mongoose.model("Admin",adminSchema);