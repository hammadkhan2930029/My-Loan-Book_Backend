const cleanString = value => (typeof value === 'string' ? value.trim() : '');

const createResult = (value, errors) => ({
  value,
  errors,
});

const addContactValidator = body => {
  const errors = [];
  const value = {};
  const regCode = cleanString(body.reg_code || body.regCode).toUpperCase();

  if (!regCode) {
    errors.push({
      field: 'reg_code',
      message: 'Registration code is required',
    });
  } else if (!/^[A-Z0-9]{6}$/.test(regCode)) {
    errors.push({
      field: 'reg_code',
      message: 'Registration code must be 6 uppercase letters or numbers',
    });
  } else {
    value.reg_code = regCode;
  }

  return createResult(value, errors);
};

module.exports = {
  addContactValidator,
};
