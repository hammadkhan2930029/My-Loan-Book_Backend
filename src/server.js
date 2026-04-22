const app = require('./app');
const {connectDB, env} = require('./config');

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(env.port, () => {
      console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error.message);

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');

  if (server) {
    server.close(() => {
      console.log('Process terminated.');
    });
  }
});
