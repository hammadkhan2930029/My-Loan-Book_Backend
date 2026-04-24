const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [3, 'Full name must be at least 3 characters'],
      maxlength: [80, 'Full name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^\+?[0-9\s\-()]{10,20}$/, 'Enter a valid phone number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{2}$/, 'User ID must be a 2 digit number'],
    },
    reg_code: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9]{6}$/, 'Registration code must be 6 uppercase letters or numbers'],
      default: null,
    },
    profilePhoto: {
      type: String,
      trim: true,
      maxlength: [2000000, 'Profile photo is too large'],
      default: '',
    },
    resetPasswordToken: {
      type: String,
      select: false,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
      },
    },
  },
);

userSchema.index({email: 1}, {unique: true});
userSchema.index({phone: 1}, {unique: true});
userSchema.index({userId: 1}, {unique: true});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
