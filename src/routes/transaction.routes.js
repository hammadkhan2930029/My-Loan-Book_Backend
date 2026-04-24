const express = require('express');

const {transactionController} = require('../controllers');
const {protect} = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createRepaymentRequestValidator,
  createTransactionValidator,
} = require('../validators');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(transactionController.listTransactions)
  .post(validate(createTransactionValidator), transactionController.createTransaction);

router.post(
  '/repayment-requests',
  validate(createRepaymentRequestValidator),
  transactionController.createRepaymentRequest,
);
router.patch('/:id/approve-repayment', transactionController.approveRepaymentRequest);

router.get('/:id', transactionController.getTransaction);

module.exports = router;
