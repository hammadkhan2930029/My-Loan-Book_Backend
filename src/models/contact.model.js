const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Contact owner is required'],
      index: true,
    },
    contactUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Contact user is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

contactSchema.index({owner: 1, contactUser: 1}, {unique: true});

module.exports = mongoose.model('Contact', contactSchema);
