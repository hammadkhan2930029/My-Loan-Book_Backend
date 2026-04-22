const jwt = require('jsonwebtoken');

const {env} = require('../config');
const {User} = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const getBearerToken = authorizationHeader => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.split(' ')[1];
};

const protect = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    throw new ApiError('Authentication token is required', 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw new ApiError('Authentication token is invalid or expired', 401);
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError('Authenticated user no longer exists', 401);
  }

  req.user = user;
  next();
});

module.exports = {
  protect,
};
