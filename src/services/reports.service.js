const transactionService = require('./transaction.service');

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

const formatDate = value =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const getReportsData = async (ownerId, filters = {}) => {
  const month = Number(filters.month) || new Date().getMonth() + 1;
  const year = Number(filters.year) || new Date().getFullYear();
  const transactions = await transactionService.listTransactions(ownerId);
  const reportTransactions = transactions.filter(transaction => {
    if (transaction.status === 'pending') {
      return false;
    }

    const transactionDate = new Date(transaction.transactionDate);

    return (
      transactionDate.getMonth() + 1 === month &&
      transactionDate.getFullYear() === year
    );
  });

  const gave = reportTransactions.reduce((total, transaction) => {
    if (transaction.category === 'loan' && transaction.type === 'gave') {
      return total + (Number(transaction.amount) || 0);
    }

    return total;
  }, 0);

  const took = reportTransactions.reduce((total, transaction) => {
    if (
      (transaction.category === 'loan' && transaction.type === 'took') ||
      (transaction.category === 'repayment' && transaction.type === 'took')
    ) {
      return total + (Number(transaction.amount) || 0);
    }

    return total;
  }, 0);

  const currency = reportTransactions[0]?.currency || 'PKR';
  const total = gave + took;
  const history = reportTransactions.slice(0, 8).map(transaction => ({
    amount: transaction.type === 'gave'
      ? `-${formatCurrencyValue(transaction.amount, transaction.currency)}`
      : `+${formatCurrencyValue(transaction.amount, transaction.currency)}`,
    id: transaction.id,
    subtitle: `${
      transaction.category === 'repayment' ? 'Repayment' : transaction.type === 'gave' ? 'You gave money' : 'You took money'
    } - ${formatDate(transaction.transactionDate)}`,
    title:
      transaction.category === 'repayment'
        ? `${transaction.counterpartyName} repayment`
        : transaction.counterpartyName,
  }));

  return {
    history,
    summary: {
      currency,
      gave: formatCurrencyValue(gave, currency),
      gaveCount: reportTransactions.filter(
        transaction => transaction.category === 'loan' && transaction.type === 'gave',
      ).length,
      rawGave: gave,
      rawTook: took,
      titleMonth: new Intl.DateTimeFormat('en-US', {month: 'short'}).format(
        new Date(year, month - 1, 1),
      ),
      took: formatCurrencyValue(took, currency),
      tookCount: reportTransactions.filter(
        transaction =>
          (transaction.category === 'loan' && transaction.type === 'took') ||
          (transaction.category === 'repayment' && transaction.type === 'took'),
      ).length,
      total,
      totalDisplay: formatCurrencyValue(total, currency),
      totalEntries: history.length,
      year,
    },
  };
};

module.exports = {
  getReportsData,
};
