const jwt = require('jsonwebtoken');

const createSendToken = (user, statusCode, res) => {
  // Create JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );

  // Hide password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token, // send token in response
    data: {
      userId:user._id,
      name:user.name,
      email:user.email,
      role:user.role

    },
  });
};

module.exports = createSendToken;
