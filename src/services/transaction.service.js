const {Contact, Transaction} = require('../models');
const ApiError = require('../utils/apiError');

const invertType = type => (type === 'gave' ? 'took' : 'gave');

const getIdString = value => (value?._id ? value._id.toString() : value.toString());

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

const createTransaction = async (ownerId, payload) => {
  const contact = await ensureOwnedContact(ownerId, payload.contactId);

  const transaction = await Transaction.create({
    owner: ownerId,
    contact: contact._id,
    contactUser: contact.contactUser,
    type: payload.type,
    amount: payload.amount,
    currency: payload.currency || 'PKR',
    category: payload.category || 'loan',
    status: payload.status || 'approved',
    parentTransaction: payload.parentTransaction || null,
    approvedAt: payload.status === 'pending' ? null : new Date(),
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

  return getPublicTransaction(transaction, ownerId);
};

const createRepaymentRequest = async (ownerId, payload) => {
  const contact = await ensureOwnedContact(ownerId, payload.contactId);

  const repayment = await Transaction.create({
    owner: ownerId,
    contact: contact._id,
    contactUser: contact.contactUser,
    type: 'gave',
    amount: payload.amount,
    currency: payload.currency || 'PKR',
    category: 'repayment',
    status: 'pending',
    parentTransaction: payload.parentTransaction || null,
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

  return getPublicTransaction(repayment, ownerId);
};

const approveRepaymentRequest = async (ownerId, transactionId) => {
  const transaction = await ensureTransactionParticipant(ownerId, transactionId);

  if (transaction.category !== 'repayment') {
    throw new ApiError('Only repayment requests can be approved', 400);
  }

  if (transaction.status !== 'pending') {
    throw new ApiError('Repayment request is already processed', 400);
  }

  if (getIdString(transaction.contactUser) !== ownerId.toString()) {
    throw new ApiError('Only the receiving user can approve this repayment', 403);
  }

  transaction.status = 'approved';
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

  return getPublicTransaction(transaction, ownerId);
};

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
    .filter(transaction => {
      if (filters.type && ['gave', 'took'].includes(filters.type)) {
        return transaction.type === filters.type;
      }

      return true;
    });
};

const getTransactionById = async (ownerId, transactionId) => {
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
  createRepaymentRequest,
  createTransaction,
  getTransactionById,
  listTransactions,
};
