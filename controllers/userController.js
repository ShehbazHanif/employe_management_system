const User = require('../models/user');
const Task = require('../models/task');
const bcrypt = require('bcrypt');
const createSendToken  = require('../utils/generateToken');
const {catchAsync} = require('../middlewares/errorHandler')
// register User
const register = async (req, res) => {
  try {
    const { password , email } = req.body;

    const existingUser = await User.findOne({email});
    if(existingUser){
        return res.status(404).json({
            status:404,
            data:[],
            message:"user is already found"
        })

    }
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = await User.create({ ...req.body, password: hashedPassword });
    user.password = undefined;
    res.status(201).json({ status: 'success', data: user });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// login user 
const login = async(req,res)=> {
    const {email, password} = req.body;


    const validUser = await User.findOne({email});
    if(!validUser){
        return res.status(404).json({
            status:404,
            data:[],
            message:"user is not valid"
        })
    }

    const isCorrectPassword = await bcrypt.compare(password ,validUser.password);

    if(!isCorrectPassword){
        return res.status(404).json({
            status:404,
            data:[],
            message:"password is invalid"
        })
    } 

    // generate Token 
 createSendToken(validUser, 200, res);

}

// Get current user profile
const getUserProfile = catchAsync(async (req, res, next) => {
  console.log("id",req.user?.id);
  const user = await User.findById(req.user.id).select('-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil');
  
  if (!user) {
    return next(new AppError('user not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// update Profile
const updateUserProfile = catchAsync(async (req, res, next) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const {
    name,
    email,
    phone,
    department,
    designation,
    location,
    profileImageUrl
  } = req.body;

  const updatedData = {
    ...(name && { name }),
    ...(email && { email }),
    ...(phone && { phone }),
    ...(department && { department }),
    ...(designation && { designation }),
    ...(location && { location }),
    ...(profileImageUrl && { profileImageUrl })
  };

  const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
    new: true,
    runValidators: true,
    select: '-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil'
  });

  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 200,
    data: {
      user: updatedUser
    }
  });
});

// Get All Users
const getAlLUsers = async(req,res)=>{

try {
   const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const total = await User.countDocuments();
    const users = await User.find().sort({createdAt:-1}).skip((page-1)*limit);

    return res.status(200).json({
      status: 200,
      page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      users,
      message:"fetch users successfull"
    });
  
} catch (err) {

  res.status(500).json({ status: 500, message: err.message });
}
}

// get filter user
const getFilterUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {
      $or: [
        { phone: { $regex: search, $options: 'i' } },
         { department: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
         { status: { $regex: search, $options: 'i' } },
      ],
    };

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    res.status(200).json({
      status: 200,
      page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      users,
      message:"fetch users successfull"
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Get Single User
const getSingleUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(200).json({ status: 200, data: user });
};

// Update User
const updateUser = async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json({ status: 'success', data: updated });
};

// Delete User
const  deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status:200,
    data:[],
    message:"user delete successfull"
  })
};

//Get Latest Task
const getLatestTask = async (req, res) => {
  try {
    const assignedTo = req.user?.id;

    if (!assignedTo) {
      return res.status(400).json({
        status: 400,
        message: "User ID is required",
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const latestTask = await Task.findOne({
      assignedTo,
      createdAt: { $gte: startOfDay },
    })
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    if (!latestTask) {
      return res.status(404).json({
        status: 404,
        message: "No task found for today",
      });
    }

    res.status(200).json({
      status: 200,
      data: latestTask,
      message: "Latest task fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// get all tasks
const getAllTasks = async (req, res) => {
  try {
    const assignedTo = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const totalTasks = await Task.countDocuments({ assignedTo });

    const tasks = await Task.find({ assignedTo })
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: 200,
      data: tasks,
      pagination: {
        total: totalTasks,
        page,
        limit,
        totalPages: Math.ceil(totalTasks / limit),
      },
      message: "Tasks fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

const userContoller ={
    register,
    login,
    getUserProfile,
    getAlLUsers,
    getSingleUser,
    updateUser,
    deleteUser,
    getFilterUser,
    getAllTasks,
    getLatestTask,
    updateUserProfile
};

module.exports = userContoller;