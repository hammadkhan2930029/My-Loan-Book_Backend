const {transactionService} = require('../services');
const asyncHandler = require('../utils/asyncHandler');

const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createTransaction(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
    transaction,
  });
});

const createRepaymentRequest = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createRepaymentRequest(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Repayment request created successfully',
    transaction,
  });
});

const approveRepaymentRequest = asyncHandler(async (req, res) => {
  const transaction = await transactionService.approveRepaymentRequest(
    req.user.id,
    req.params.id,
  );

  res.status(200).json({
    success: true,
    message: 'Repayment request approved successfully',
    transaction,
  });
});

const listTransactions = asyncHandler(async (req, res) => {
  const transactions = await transactionService.listTransactions(req.user.id, {
    contactId: req.query.contactId,
    type: req.query.type,
  });

  res.status(200).json({
    success: true,
    message: 'Transactions fetched successfully',
    transactions,
  });
});

const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionById(
    req.user.id,
    req.params.id,
  );

  res.status(200).json({
    success: true,
    message: 'Transaction fetched successfully',
    transaction,
  });
});

module.exports = {
  approveRepaymentRequest,
  createRepaymentRequest,
  createTransaction,
  getTransaction,
  listTransactions,
};
