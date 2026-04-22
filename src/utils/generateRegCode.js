const crypto = require('crypto');

const REG_CODE_LENGTH = 6;
const REG_CODE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const generateRegCode = () => {
  let code = '';

  for (let index = 0; index < REG_CODE_LENGTH; index += 1) {
    const randomIndex = crypto.randomInt(0, REG_CODE_CHARACTERS.length);
    code += REG_CODE_CHARACTERS[randomIndex];
  }

  return code;
};

module.exports = generateRegCode;
