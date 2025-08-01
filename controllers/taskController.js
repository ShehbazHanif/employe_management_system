const Task = require('../models/task');

// post Task
const postTask = async (req, res) => {
  try {
    const {attachments }= req.body;
    const assignedBy  = req.user?.id;
    console.log("assignedBy",req.user?.id)

    // Parse string to array if needed
    let parsedAttachments = attachments;
    if (typeof attachments === 'string') {
      parsedAttachments = attachments
        .replace(/\[|\]/g, '')  // remove brackets
        .split(',')             // split by comma
        .map(att => att.trim());  // trim whitespace
    }
    const task = await Task.create({...req.body,
      attachments:parsedAttachments,
      assignedBy,
   });
    res.status(201).json({ status: 200, data:task,
      message :"task post successfull"
     });
  } catch (err) {
    console.log(err.message);
    res.status(400).json({ status: 400, message: err.message });
  }
};

// Update Task
const updateTask = async (req, res) => {
  try {
    const {id} = req.params  ;
    const task = await Task.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!task) return res.status(404).json({ status: 404, message: 'Task not found' });
    res.status(200).json({ status: 200, 
      data:task,
    message:"task updated successfull" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete Task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ status: 404, message: 'Task not found' });

   return  res.status(200).json({ status: 200, message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get Single Task
const getSingleTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ status: 200,
      data: task,
    message:"Fetch task successfull" });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};
// Get ALl tasks with Pagination

const getAllTasks = async(req,res)=>{

try {
   const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const total = await Task.countDocuments();
    const tasks = await Task.find().sort({createdAt:-1}).skip((page-1)*limit);

    return res.status(200).json({
      status: 200,
      page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      tasks,
      message:"fetch task successfull"
    });
  
} catch (err) {

  res.status(500).json({ status: 500, message: err.message });
}
}

// Get filter Tasks with Pagination & Search
const getFilterTask = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {
      $or: [
        { title: { $regex: search, $options: 'i' } },
         { status: { $regex: search, $options: 'i' } },
        { priority: { $regex: search, $options: 'i' } },
         { description: { $regex: search, $options: 'i' } },
      ],
    };

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')

    res.status(200).json({
      status: 200,
      page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      tasks,
      message:"fetch task successfull"
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Add Comment to Task
const addComment = async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || !userId)
      return res.status(400).json({ status: 400, message: 'Message and userId are required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ status: 404, message: 'Task not found' });

    task.comments.push({ message, user: userId });
    task.updatedAt = new Date();
    await task.save();

    res.status(200).json({ status: 200, message: 'Comment added', 
      data: task });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
};

const taskController ={
  postTask,
  updateTask,
  deleteTask,
  getFilterTask,
  getSingleTask,
  addComment,
  getAllTasks
}

module.exports = taskController;