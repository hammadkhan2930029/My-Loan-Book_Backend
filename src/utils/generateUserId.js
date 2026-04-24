const crypto = require('crypto');

const generateUserId = () => crypto.randomInt(10, 100).toString();

module.exports = generateUserId;
