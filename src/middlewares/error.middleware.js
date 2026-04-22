const normalizeError = error => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    return {
      statusCode: 409,
      message: `${field} is already registered`,
      errors: [
        {
          field,
          message: `${field} must be unique`,
        },
      ],
    };
  }

  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: 'Validation failed',
      errors: Object.values(error.errors).map(item => ({
        field: item.path,
        message: item.message,
      })),
    };
  }

  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid resource identifier',
    };
  }

  return {
    statusCode: error.statusCode || 500,
    message: error.message || 'Internal server error',
    errors: error.errors,
  };
};

const errorHandler = (error, req, res, next) => {
  const normalizedError = normalizeError(error);

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  res.status(normalizedError.statusCode).json({
    success: false,
    message: normalizedError.message,
    ...(normalizedError.errors && {errors: normalizedError.errors}),
    ...(process.env.NODE_ENV === 'development' && {stack: error.stack}),
  });
};

module.exports = errorHandler;
