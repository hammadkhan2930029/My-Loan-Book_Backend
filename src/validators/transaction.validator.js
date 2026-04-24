const attachmentPattern =
  /^(https?:\/\/\S+|data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+)$/;

const cleanString = value => (typeof value === 'string' ? value.trim() : '');

const createResult = (value, errors) => ({
  value,
  errors,
});

const createTransactionValidator = body => {
  const errors = [];
  const value = {};
  const contactId = cleanString(body.contactId || body.contact);
  const type = cleanString(body.type).toLowerCase();
  const amount = Number(body.amount);
  const currency = cleanString(body.currency || body.currencyCode).toUpperCase();
  const transactionDate = cleanString(body.transactionDate || body.date);
  const dueDate = cleanString(body.dueDate || body.returnDueDate);
  const monthlyPaymentDayRaw = cleanString(
    body.monthlyPaymentDay || body.installmentDay || body.monthlyReturnDate,
  );
  const note = cleanString(body.note);
  const attachment = cleanString(body.attachment);

  if (!contactId) {
    errors.push({
      field: 'contactId',
      message: 'Contact is required',
    });
  } else {
    value.contactId = contactId;
  }

  if (!type) {
    errors.push({
      field: 'type',
      message: 'Transaction type is required',
    });
  } else if (!['gave', 'took'].includes(type)) {
    errors.push({
      field: 'type',
      message: 'Transaction type must be gave or took',
    });
  } else {
    value.type = type;
  }

  if (!Number.isFinite(amount)) {
    errors.push({
      field: 'amount',
      message: 'Amount must be a valid number',
    });
  } else if (amount <= 0) {
    errors.push({
      field: 'amount',
      message: 'Amount must be greater than zero',
    });
  } else {
    value.amount = amount;
  }

  if (!currency) {
    value.currency = 'PKR';
  } else if (!['PKR', 'USD', 'SAR', 'AED', 'EUR', 'GBP'].includes(currency)) {
    errors.push({
      field: 'currency',
      message: 'Select a valid currency',
    });
  } else {
    value.currency = currency;
  }

  if (transactionDate) {
    const parsedDate = new Date(transactionDate);

    if (Number.isNaN(parsedDate.getTime())) {
      errors.push({
        field: 'transactionDate',
        message: 'Enter a valid transaction date',
      });
    } else {
      value.transactionDate = parsedDate;
    }
  }

  if (dueDate) {
    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      errors.push({
        field: 'dueDate',
        message: 'Enter a valid return due date',
      });
    } else {
      value.dueDate = parsedDueDate;
    }
  }

  if (value.transactionDate && value.dueDate && value.dueDate < value.transactionDate) {
    errors.push({
      field: 'dueDate',
      message: 'Return due date must be on or after the loan date',
    });
  }

  if (monthlyPaymentDayRaw) {
    const monthlyPaymentDay = Number(monthlyPaymentDayRaw);

    if (!Number.isInteger(monthlyPaymentDay) || monthlyPaymentDay < 1 || monthlyPaymentDay > 31) {
      errors.push({
        field: 'monthlyPaymentDay',
        message: 'Monthly payment day must be between 1 and 31',
      });
    } else {
      value.monthlyPaymentDay = monthlyPaymentDay;
    }
  }

  if (note.length > 500) {
    errors.push({
      field: 'note',
      message: 'Note cannot exceed 500 characters',
    });
  } else {
    value.note = note;
  }

  if (attachment) {
    if (attachment.length > 2000000) {
      errors.push({
        field: 'attachment',
        message: 'Attachment is too large',
      });
    } else if (!attachmentPattern.test(attachment)) {
      errors.push({
        field: 'attachment',
        message: 'Enter a valid attachment URL or base64 image data',
      });
    } else {
      value.attachment = attachment;
    }
  }

  return createResult(value, errors);
};

const createRepaymentRequestValidator = body => {
  const result = createTransactionValidator({
    ...body,
    type: 'gave',
  });

  delete result.value.dueDate;
  delete result.value.monthlyPaymentDay;
  result.value.type = 'gave';
  result.value.category = 'repayment';
  result.value.status = 'pending';

  return result;
};

module.exports = {
  createRepaymentRequestValidator,
  createTransactionValidator,
};
