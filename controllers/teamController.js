const Team = require('../models/team');
const User = require('../models/user');
const {AppError} = require('../middlewares/errorHandler');

// CREATE team
const registerTeam = async (req, res, next) => {
  try {
    const { name, members } = req.body;
    //console.log("Body",req.body);
    const addedBy = req.user?.id;

    // Parse string to array if needed
    let parsedMembers = members;
    if (typeof members === 'string') {
      parsedMembers = members
        .replace(/\[|\]/g, '')  // remove brackets
        .split(',')             // split by comma
        .map(id => id.trim());  // trim whitespace
    }

    const team = await Team.create({
      name,
      members: parsedMembers,
      addedBy
    });

    res.status(201).json({
      status: 201,
      data: team,
      message: 'Team registered successfully'
    });
  } catch (err) {
    next(err);
  }
};


// GET single team by ID
const getSingleTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email role')
      .populate('addedBy', 'name email');

    if (!team) return next(new AppError('Team not found', 404));

    res.status(200).json({ status: 200, data:team,
        message:"fetch single-team successfull"
     });
  } catch (err) {
    next(err);
  }
};

// GET all teams with pagination
const getAllTeam = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const teams = await Team.find()
      .populate('members', 'name email role')
      .populate('addedBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Team.countDocuments();

    res.status(200).json({
      status: 200,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      teams,
    });
  } catch (err) {
    next(err);
  }
};


// GET all teams with pagination and optional search
const getFilterdTeam = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      name: { $regex: search, $options: 'i' },
    };

    const teams = await Team.find(query)
      .populate('members', 'name email role')
      .populate('addedBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Team.countDocuments(query);

    res.status(200).json({
      status: 200,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      teams,
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE team
const updateTeam = async (req, res, next) => {
  try {
    const { name, members } = req.body;

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { name, members },
      { new: true }
    );

    if (!team) return next(new AppError('Team not found', 404));

    res.status(200).json({ status: 200, data:team,
        message:"update team successfull"
     });
  } catch (err) {
    next(err);
  }
};

// DELETE team
const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) return next(new AppError('Team not found', 404));

    res.status(200).json({ status: 200, message: 'Team deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const teamController = {
    registerTeam,
    getAllTeam,
    getFilterdTeam,
    getSingleTeam,
    updateTeam,
    deleteTeam
};

module.exports = teamController;
