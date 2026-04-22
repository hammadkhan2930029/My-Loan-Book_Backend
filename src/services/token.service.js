const jwt = require('jsonwebtoken');

const {env} = require('../config');

const generateJwt = userId =>
  jwt.sign({id: userId.toString()}, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

module.exports = {
  generateJwt,
};
