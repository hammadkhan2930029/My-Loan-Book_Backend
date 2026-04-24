const mongoose = require('mongoose');

const legalSectionSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      trim: true,
      default: '',
    },
    bullets: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const legalContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    effectiveDateLabel: {
      type: String,
      required: true,
      trim: true,
    },
    intro: {
      type: String,
      default: '',
      trim: true,
    },
    sections: {
      type: [legalSectionSchema],
      default: [],
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('LegalContent', legalContentSchema);
