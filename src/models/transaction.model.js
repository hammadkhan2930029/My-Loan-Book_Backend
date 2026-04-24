const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction owner is required'],
      index: true,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: [true, 'Contact is required'],
      index: true,
    },
    contactUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Contact user is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: ['gave', 'took'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      enum: ['PKR', 'USD', 'SAR', 'AED', 'EUR', 'GBP'],
      default: 'PKR',
    },
    category: {
      type: String,
      required: [true, 'Transaction category is required'],
      enum: ['loan', 'repayment'],
      default: 'loan',
    },
    status: {
      type: String,
      required: [true, 'Transaction status is required'],
      enum: ['approved', 'confirmed', 'pending', 'rejected'],
      default: 'approved',
    },
    parentTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
      index: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    monthlyPaymentDay: {
      type: Number,
      min: [1, 'Monthly payment day must be between 1 and 31'],
      max: [31, 'Monthly payment day must be between 1 and 31'],
      default: null,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
    attachment: {
      type: String,
      trim: true,
      maxlength: [2000000, 'Attachment is too large'],
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

transactionSchema.index({owner: 1, transactionDate: -1});
transactionSchema.index({owner: 1, contact: 1, transactionDate: -1});

module.exports = mongoose.model('Transaction', transactionSchema);
