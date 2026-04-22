const ApiError = require('../utils/apiError');

const notFound = (req, res, next) => {
  next(new ApiError(`Route not found: ${req.originalUrl}`, 404));
};

module.exports = notFound;
