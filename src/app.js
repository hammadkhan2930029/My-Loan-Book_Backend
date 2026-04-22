const cors = require('cors');
const express = require('express');

const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const notFound = require('./middlewares/notFound.middleware');

const app = express();

app.use(cors());
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MyLoanBook backend is running',
  });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
