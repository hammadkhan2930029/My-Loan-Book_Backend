require('dotenv').config();

const getRequiredEnv = key => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const parsePort = value => {
  const port = Number(value || 5000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive number');
  }

  return port;
};

const jwtSecret = getRequiredEnv('JWT_SECRET');

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT),
  mongoUri: getRequiredEnv('MONGO_URI'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
