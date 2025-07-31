const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  attachments: [{ type: String }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Individual users

  status: {
    type: String,
    enum: ['Pending', 'Progress', 'Complete', 'Overdue'],
    default: 'Pending',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  dueDate: { type: Date, required: true },

  comments: [commentSchema], // Array of comments
  

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);
