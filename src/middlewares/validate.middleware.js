const ApiError = require('../utils/apiError');

const validate = validator => (req, res, next) => {
  const {errors, value} = validator(req.body);

  if (errors.length) {
    return next(new ApiError('Validation failed', 400, errors));
  }

  req.body = value;
  return next();
};

module.exports = validate;
