const User = require('../models/user');
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
  const user = await User.findById(req.user._id).select('-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil');
  
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

// Get All Users
const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({ status: 'success', data: users });
};

// Get Single User
const getSingleUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(200).json({ status: 'success', data: user });
};

// Update User
const updateUser = async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json({ status: 'success', data: updated });
};

// Delete User
const  deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).send();
};

const userContoller ={
    register,
    login,
    getUserProfile,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser
};

module.exports = userContoller;