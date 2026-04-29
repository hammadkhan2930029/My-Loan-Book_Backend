const mongoose = require('mongoose');

const {Contact, Transaction} = require('../models');
const notificationService = require('./notification.service');
const ApiError = require('../utils/apiError');

const FINAL_TRANSACTION_STATUSES = ['approved', 'confirmed'];
const FINAL_OR_LEGACY_STATUS_FILTER = {
  $or: [
    {status: {$in: FINAL_TRANSACTION_STATUSES}},
    {status: {$exists: false}},
    {status: null},
  ],
};
const LOAN_OR_LEGACY_CATEGORY_FILTER = {
  $or: [{category: 'loan'}, {category: {$exists: false}}, {category: null}],
};

const invertType = type => (type === 'gave' ? 'took' : 'gave');
const getIdString = value => (value?._id ? value._id.toString() : value.toString());

const formatCurrencyValue = (amount, currency = 'PKR') => {
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  } catch {
    return `${currency} ${Number(amount) || 0}`;
  }
};

const ensureValidObjectId = (value, fieldName) => {
  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError(`Invalid ${fieldName}`, 400);
  }
};

const getViewerContactId = async (transaction, viewerId) => {
  const ownerId = getIdString(transaction.owner);
  const contactUserId = getIdString(transaction.contactUser);

  if (ownerId === viewerId.toString()) {
    return getIdString(transaction.contact);
  }

  const reciprocalContact = await Contact.findOne({
    owner: viewerId,
    contactUser: ownerId,
  }).select('_id');

  if (reciprocalContact?._id) {
    return reciprocalContact._id.toString();
  }

  const directContact = await Contact.findOne({
    owner: viewerId,
    contactUser: contactUserId,
  }).select('_id');

  return directContact?._id ? directContact._id.toString() : getIdString(transaction.contact);
};

const getPublicTransaction = async (transaction, viewerId) => {
  const ownerId = getIdString(transaction.owner);
  const contactUserId = getIdString(transaction.contactUser);
  const isOwnerView = ownerId === viewerId.toString();
  const counterparty = isOwnerView ? transaction.contactUser : transaction.owner;
  const counterpartyId = getIdString(counterparty);
  const viewerType = isOwnerView ? transaction.type : invertType(transaction.type);
  const viewerContactId = await getViewerContactId(transaction, viewerId);

  return {
    id: transaction._id.toString(),
    contactId: viewerContactId,
    ownerUserId: ownerId,
    contactUserId,
    counterpartyUserId: counterpartyId,
    contactName: counterparty.fullName,
    counterpartyName: counterparty.fullName,
    contactPhoto: counterparty.profilePhoto || '',
    counterpartyPhoto: counterparty.profilePhoto || '',
    creatorName: transaction.owner.fullName,
    creatorUserId: ownerId,
    type: viewerType,
    recordedType: transaction.type,
    category: transaction.category || 'loan',
    status: transaction.status || 'approved',
    loanId: transaction.parentTransaction ? getIdString(transaction.parentTransaction) : null,
    parentTransactionId: transaction.parentTransaction
      ? getIdString(transaction.parentTransaction)
      : null,
    approvedAt: transaction.approvedAt || null,
    viewerRole: isOwnerView ? 'creator' : 'counterparty',
    amount: transaction.amount,
    currency: transaction.currency || 'PKR',
    transactionDate: transaction.transactionDate,
    dueDate: transaction.dueDate || null,
    monthlyPaymentDay: transaction.monthlyPaymentDay || null,
    note: transaction.note,
    attachment: transaction.attachment || '',
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
};

const populateTransaction = query =>
  query
    .populate({
      path: 'contactUser',
      select: 'fullName profilePhoto',
    })
    .populate({
      path: 'owner',
      select: 'fullName profilePhoto',
    });

const ensureOwnedContact = async (ownerId, contactId) => {
  ensureValidObjectId(contactId, 'contact identifier');

  const contact = await Contact.findOne({
    _id: contactId,
    owner: ownerId,
  });

  if (!contact) {
    throw new ApiError('Contact not found', 404);
  }

  return contact;
};

const ensureTransactionParticipant = async (viewerId, transactionId) => {
  ensureValidObjectId(transactionId, 'transaction identifier');

  const transaction = await populateTransaction(
    Transaction.findOne({
      _id: transactionId,
      $or: [{owner: viewerId}, {contactUser: viewerId}],
    }),
  );

  if (!transaction) {
    throw new ApiError('Transaction not found', 404);
  }

  return transaction;
};

const ensureLoanBelongsToUsers = async ({loanId, borrowerId, lenderId}) => {
  ensureValidObjectId(loanId, 'loan identifier');
  const loan = await Transaction.findOne({
    _id: loanId,
    $and: [
      LOAN_OR_LEGACY_CATEGORY_FILTER,
      FINAL_OR_LEGACY_STATUS_FILTER,
      {
        $or: [
          {owner: borrowerId, contactUser: lenderId},
          {owner: lenderId, contactUser: borrowerId},
        ],
      },
    ],
  }).select('_id owner contactUser amount currency category type status');

  if (!loan) {
    throw new ApiError('Loan not found for this borrower and lender', 404);
  }

  return loan;
};

const buildViewerPairSummary = async ({viewerId, counterpartyUserId}) => {
  const pairTransactions = await Transaction.find({
    $and: [
      FINAL_OR_LEGACY_STATUS_FILTER,
      {
        $or: [
          {owner: viewerId, contactUser: counterpartyUserId},
          {owner: counterpartyUserId, contactUser: viewerId},
        ],
      },
    ],
  }).select('owner contactUser type amount category status');

  return pairTransactions.reduce(
    (summary, transaction) => {
      const ownerId = getIdString(transaction.owner);
      const viewerType =
        ownerId === viewerId.toString() ? transaction.type : invertType(transaction.type);
      const amount = Number(transaction.amount) || 0;

      if (transaction.category === 'repayment') {
        if (viewerType === 'gave') {
          summary.repaid += amount;
        } else {
          summary.collected += amount;
        }
      } else if (viewerType === 'took') {
        summary.took += amount;
      } else {
        summary.gave += amount;
      }

      summary.remainingToPay = Math.max(summary.took - summary.repaid, 0);
      summary.remainingToReceive = Math.max(summary.gave - summary.collected, 0);

      return summary;
    },
    {
      gave: 0,
      took: 0,
      repaid: 0,
      collected: 0,
      remainingToPay: 0,
      remainingToReceive: 0,
    },
  );
};

const createTransaction = async (ownerId, payload) => {
  const contact = await ensureOwnedContact(ownerId, payload.contactId);
  const category = payload.category || 'loan';
  const isLoanRequest = category === 'loan';
  const status = payload.status || (isLoanRequest ? 'pending' : 'approved');
  const approvedAt = status === 'pending' ? null : new Date();

  const transaction = await Transaction.create({
    owner: ownerId,
    contact: contact._id,
    contactUser: contact.contactUser,
    type: payload.type,
    amount: payload.amount,
    currency: payload.currency || 'PKR',
    category,
    status,
    parentTransaction: payload.parentTransaction || null,
    approvedAt,
    transactionDate: payload.transactionDate || new Date(),
    dueDate: payload.dueDate || null,
    monthlyPaymentDay: payload.monthlyPaymentDay || null,
    note: payload.note || '',
    attachment: payload.attachment || '',
  });

  await transaction.populate({
    path: 'contactUser',
    select: 'fullName profilePhoto',
  });
  await transaction.populate({
    path: 'owner',
    select: 'fullName profilePhoto',
  });

  if (isLoanRequest && status === 'pending') {
    const loanMessage =
      payload.type === 'took'
        ? `${transaction.owner.fullName} recorded borrowing ${formatCurrencyValue(
            transaction.amount,
            transaction.currency,
          )} from you. Please confirm this loan to add it to both ledgers.`
        : `${transaction.owner.fullName} assigned you a loan of ${formatCurrencyValue(
            transaction.amount,
            transaction.currency,
          )}. Please confirm it to add it to your ledger.`;

    await notificationService.createNotification({
      userId: contact.contactUser,
      senderId: ownerId,
      loanId: transaction._id,
      transactionId: transaction._id,
      title: 'Loan assigned',
      message: loanMessage,
      type: 'loan_assigned',
    });
  }

  return getPublicTransaction(transaction, ownerId);
};

const createRepaymentRequest = async (ownerId, payload) => {
  const contact = await ensureOwnedContact(ownerId, payload.contactId);
  const lenderId = contact.contactUser;
  const ledgerSummary = await buildViewerPairSummary({
    viewerId: ownerId,
    counterpartyUserId: lenderId,
  });

  if (ledgerSummary.remainingToPay <= 0) {
    throw new ApiError(
      'Only a borrower with an outstanding balance can submit a payment request',
      400,
    );
  }

  if (payload.amount > ledgerSummary.remainingToPay) {
    throw new ApiError('Payment amount cannot exceed the outstanding balance', 400);
  }

  const loanId = payload.parentTransaction || payload.loanId || null;

  if (loanId) {
    // When a repayment is tied to a specific loan, make sure both users belong to it.
    await ensureLoanBelongsToUsers({
      loanId,
      borrowerId: ownerId,
      lenderId,
    });
  }

  const repayment = await Transaction.create({
    owner: ownerId,
    contact: contact._id,
    contactUser: lenderId,
    type: 'gave',
    amount: payload.amount,
    currency: payload.currency || 'PKR',
    category: 'repayment',
    status: 'pending',
    parentTransaction: loanId,
    transactionDate: payload.transactionDate || new Date(),
    note: payload.note || '',
    attachment: payload.attachment || '',
  });

  await repayment.populate({
    path: 'contactUser',
    select: 'fullName profilePhoto',
  });
  await repayment.populate({
    path: 'owner',
    select: 'fullName profilePhoto',
  });

  await notificationService.createNotification({
    userId: lenderId,
    senderId: ownerId,
    loanId,
    transactionId: repayment._id,
    title: 'Payment submitted',
    message: `${repayment.owner.fullName} has submitted a payment of ${formatCurrencyValue(
      repayment.amount,
      repayment.currency,
    )} for your loan. Please review and confirm.`,
    type: 'payment_submitted',
  });

  return getPublicTransaction(repayment, ownerId);
};

const confirmRepaymentRequest = async (ownerId, transactionId) => {
  const transaction = await ensureTransactionParticipant(ownerId, transactionId);

  if (transaction.category !== 'repayment') {
    throw new ApiError('Only repayment transactions can be confirmed', 400);
  }

  if (transaction.status !== 'pending') {
    throw new ApiError('Payment transaction has already been processed', 400);
  }

  if (getIdString(transaction.contactUser) !== ownerId.toString()) {
    throw new ApiError('Only the lender can confirm this payment transaction', 403);
  }

  transaction.status = 'confirmed';
  transaction.approvedAt = new Date();
  await transaction.save();
  await transaction.populate({
    path: 'contactUser',
    select: 'fullName profilePhoto',
  });
  await transaction.populate({
    path: 'owner',
    select: 'fullName profilePhoto',
  });

  await notificationService.createNotification({
    userId: transaction.owner._id,
    senderId: ownerId,
    loanId: transaction.parentTransaction || null,
    transactionId: transaction._id,
    title: 'Payment confirmed',
    message: `${transaction.contactUser.fullName} has confirmed your payment of ${formatCurrencyValue(
      transaction.amount,
      transaction.currency,
    )}.`,
    type: 'payment_confirmed',
  });

  return getPublicTransaction(transaction, ownerId);
};

const confirmLoanRequest = async (ownerId, transactionId) => {
  const transaction = await ensureTransactionParticipant(ownerId, transactionId);

  if ((transaction.category || 'loan') !== 'loan') {
    throw new ApiError('Only loan transactions can be confirmed here', 400);
  }

  if (transaction.status !== 'pending') {
    throw new ApiError('Loan transaction has already been processed', 400);
  }

  if (getIdString(transaction.contactUser) !== ownerId.toString()) {
    throw new ApiError('Only the other participant can confirm this loan transaction', 403);
  }

  transaction.status = 'confirmed';
  transaction.approvedAt = new Date();
  await transaction.save();
  await transaction.populate({
    path: 'contactUser',
    select: 'fullName profilePhoto',
  });
  await transaction.populate({
    path: 'owner',
    select: 'fullName profilePhoto',
  });

  await notificationService.createNotification({
    userId: transaction.owner._id,
    senderId: ownerId,
    loanId: transaction._id,
    transactionId: transaction._id,
    title: 'Loan confirmed',
    message: `${transaction.contactUser.fullName} confirmed the loan of ${formatCurrencyValue(
      transaction.amount,
      transaction.currency,
    )}. It is now added to both ledgers.`,
    type: 'loan_confirmed',
  });

  return getPublicTransaction(transaction, ownerId);
};

const rejectLoanRequest = async (ownerId, transactionId) => {
  const transaction = await ensureTransactionParticipant(ownerId, transactionId);

  if ((transaction.category || 'loan') !== 'loan') {
    throw new ApiError('Only loan transactions can be rejected here', 400);
  }

  if (transaction.status !== 'pending') {
    throw new ApiError('Loan transaction has already been processed', 400);
  }

  if (getIdString(transaction.contactUser) !== ownerId.toString()) {
    throw new ApiError('Only the other participant can reject this loan transaction', 403);
  }

  transaction.status = 'rejected';
  transaction.approvedAt = null;
  await transaction.save();
  await transaction.populate({
    path: 'contactUser',
    select: 'fullName profilePhoto',
  });
  await transaction.populate({
    path: 'owner',
    select: 'fullName profilePhoto',
  });

  await notificationService.createNotification({
    userId: transaction.owner._id,
    senderId: ownerId,
    loanId: transaction._id,
    transactionId: transaction._id,
    title: 'Loan rejected',
    message: `${transaction.contactUser.fullName} rejected the loan of ${formatCurrencyValue(
      transaction.amount,
      transaction.currency,
    )}. It was not added to the ledger.`,
    type: 'loan_rejected',
  });

  return getPublicTransaction(transaction, ownerId);
};

const rejectRepaymentRequest = async (ownerId, transactionId) => {
  const transaction = await ensureTransactionParticipant(ownerId, transactionId);

  if (transaction.category !== 'repayment') {
    throw new ApiError('Only repayment transactions can be rejected', 400);
  }

  if (transaction.status !== 'pending') {
    throw new ApiError('Payment transaction has already been processed', 400);
  }

  if (getIdString(transaction.contactUser) !== ownerId.toString()) {
    throw new ApiError('Only the lender can reject this payment transaction', 403);
  }

  transaction.status = 'rejected';
  transaction.approvedAt = null;
  await transaction.save();
  await transaction.populate({
    path: 'contactUser',
    select: 'fullName profilePhoto',
  });
  await transaction.populate({
    path: 'owner',
    select: 'fullName profilePhoto',
  });

  await notificationService.createNotification({
    userId: transaction.owner._id,
    senderId: ownerId,
    loanId: transaction.parentTransaction || null,
    transactionId: transaction._id,
    title: 'Payment rejected',
    message: `${transaction.contactUser.fullName} has rejected your payment of ${formatCurrencyValue(
      transaction.amount,
      transaction.currency,
    )}. Please review and submit again.`,
    type: 'payment_rejected',
  });

  return getPublicTransaction(transaction, ownerId);
};

const approveRepaymentRequest = async (ownerId, transactionId) =>
  confirmRepaymentRequest(ownerId, transactionId);

const listTransactions = async (ownerId, filters = {}) => {
  const query = {
    $or: [{owner: ownerId}, {contactUser: ownerId}],
  };

  if (filters.contactId) {
    const contact = await ensureOwnedContact(ownerId, filters.contactId);

    query.$and = [
      {
        $or: [
          {owner: ownerId, contactUser: contact.contactUser},
          {owner: contact.contactUser, contactUser: ownerId},
        ],
      },
    ];
  }

  const transactions = await populateTransaction(
    Transaction.find(query).sort({transactionDate: -1, createdAt: -1}),
  );

  const publicTransactions = await Promise.all(
    transactions.map(transaction => getPublicTransaction(transaction, ownerId)),
  );

  return publicTransactions
    .filter(transaction => transaction.status !== 'rejected')
    .filter(transaction => {
      if (filters.type && ['gave', 'took'].includes(filters.type)) {
        return transaction.type === filters.type;
      }

      return true;
    });
};

const getTransactionById = async (ownerId, transactionId) => {
  ensureValidObjectId(transactionId, 'transaction identifier');
  const transaction = await populateTransaction(
    Transaction.findOne({
      _id: transactionId,
      $or: [{owner: ownerId}, {contactUser: ownerId}],
    }),
  );

  if (!transaction) {
    throw new ApiError('Transaction not found', 404);
  }

  return getPublicTransaction(transaction, ownerId);
};

module.exports = {
  approveRepaymentRequest,
  confirmLoanRequest,
  confirmRepaymentRequest,
  createRepaymentRequest,
  createTransaction,
  getTransactionById,
  listTransactions,
  rejectLoanRequest,
  rejectRepaymentRequest,
};
