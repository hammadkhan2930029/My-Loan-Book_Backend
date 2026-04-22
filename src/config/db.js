const mongoose = require('mongoose');

const env = require('./env');

const connectDB = async () => {
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', error => {
    console.error(`MongoDB connection error: ${error.message}`);
  });

  const connection = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};

module.exports = connectDB;
