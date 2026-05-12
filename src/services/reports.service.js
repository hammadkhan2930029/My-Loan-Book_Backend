const transactionService = require('./transaction.service');

const formatCurrencyValue = (amount, currency = 'PKR') => {
  try {
    const formattedNumber = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

    return `${currency} ${formattedNumber}`;
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

const getBreakdownKey = transaction => {
  if (transaction.category === 'repayment') {
    return transaction.type === 'took' ? 'returned_to_me' : 'repaid_by_me';
  }

  return transaction.type === 'gave' ? 'loans_given' : 'loans_taken';
};

const getBreakdownLabel = key => {
  const labels = {
    loans_given: 'Loan Given',
    returned_to_me: 'Returned To Me',
    loans_taken: 'Loan Taken',
    repaid_by_me: 'Repaid By Me',
  };

  return labels[key] || 'Transaction';
};

const buildHistoryItem = transaction => {
  const breakdownKey = getBreakdownKey(transaction);
  const isOutgoing = breakdownKey === 'loans_given' || breakdownKey === 'repaid_by_me';

  return {
    amount: `${isOutgoing ? '-' : '+'}${formatCurrencyValue(transaction.amount, transaction.currency)}`,
    breakdownKey,
    id: transaction.id,
    subtitle: `${getBreakdownLabel(breakdownKey)} - ${formatDate(transaction.transactionDate)}`,
    title:
      transaction.category === 'repayment'
        ? `${transaction.counterpartyName} repayment`
        : transaction.counterpartyName,
  };
};

const createEmptyHistoryBuckets = () => ({
  all: [],
  loans_given: [],
  returned_to_me: [],
  loans_taken: [],
  repaid_by_me: [],
});

const getReportsData = async (ownerId, filters = {}) => {
  const month = filters.month ? Number(filters.month) : null;
  const year = Number(filters.year) || new Date().getFullYear();
  const transactions = await transactionService.listTransactions(ownerId);

  const finalizedTransactions = transactions.filter(
    transaction => transaction.status === 'approved' || transaction.status === 'confirmed',
  );

  const reportTransactions = finalizedTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.transactionDate);
    const sameYear = transactionDate.getFullYear() === year;

    if (!sameYear) {
      return false;
    }

    if (!month) {
      return true;
    }

    return transactionDate.getMonth() + 1 === month;
  });

  const currency = reportTransactions[0]?.currency || finalizedTransactions[0]?.currency || 'PKR';
  const history = createEmptyHistoryBuckets();

  const totals = reportTransactions.reduce(
    (summary, transaction) => {
      const breakdownKey = getBreakdownKey(transaction);
      const amount = Number(transaction.amount) || 0;
      const historyItem = buildHistoryItem(transaction);

      summary.totalEntries += 1;
      summary.totalFlow += amount;
      history.all.push(historyItem);
      history[breakdownKey].push(historyItem);

      if (breakdownKey === 'loans_given') {
        summary.rawLoansGiven += amount;
        summary.loanGivenCount += 1;
      } else if (breakdownKey === 'returned_to_me') {
        summary.rawReturnedToMe += amount;
        summary.returnedToMeCount += 1;
      } else if (breakdownKey === 'loans_taken') {
        summary.rawLoansTaken += amount;
        summary.loansTakenCount += 1;
      } else if (breakdownKey === 'repaid_by_me') {
        summary.rawRepaidByMe += amount;
        summary.repaidByMeCount += 1;
      }

      return summary;
    },
    {
      loanGivenCount: 0,
      loansTakenCount: 0,
      rawLoansGiven: 0,
      rawLoansTaken: 0,
      rawRepaidByMe: 0,
      rawReturnedToMe: 0,
      repaidByMeCount: 0,
      returnedToMeCount: 0,
      totalEntries: 0,
      totalFlow: 0,
    },
  );

  const rawOutstandingToReceive = Math.max(totals.rawLoansGiven - totals.rawReturnedToMe, 0);
  const rawOutstandingToPay = Math.max(totals.rawLoansTaken - totals.rawRepaidByMe, 0);
  const rawNetBalance = rawOutstandingToReceive - rawOutstandingToPay;

  return {
    history,
    summary: {
      currency,
      loanGivenCount: totals.loanGivenCount,
      loansGiven: formatCurrencyValue(totals.rawLoansGiven, currency),
      loansTaken: formatCurrencyValue(totals.rawLoansTaken, currency),
      loansTakenCount: totals.loansTakenCount,
      month,
      netBalance: formatCurrencyValue(rawNetBalance, currency),
      outstandingToPay: formatCurrencyValue(rawOutstandingToPay, currency),
      outstandingToReceive: formatCurrencyValue(rawOutstandingToReceive, currency),
      periodLabel: month
        ? `${new Intl.DateTimeFormat('en-US', {month: 'short'}).format(new Date(year, month - 1, 1))} ${year}`
        : `${year}`,
      rawLoansGiven: totals.rawLoansGiven,
      rawLoansTaken: totals.rawLoansTaken,
      rawNetBalance,
      rawOutstandingToPay,
      rawOutstandingToReceive,
      rawRepaidByMe: totals.rawRepaidByMe,
      rawReturnedToMe: totals.rawReturnedToMe,
      repaidByMe: formatCurrencyValue(totals.rawRepaidByMe, currency),
      repaidByMeCount: totals.repaidByMeCount,
      returnedToMe: formatCurrencyValue(totals.rawReturnedToMe, currency),
      returnedToMeCount: totals.returnedToMeCount,
      titleMonth: month
        ? new Intl.DateTimeFormat('en-US', {month: 'short'}).format(new Date(year, month - 1, 1))
        : 'All',
      totalDisplay: formatCurrencyValue(totals.totalFlow, currency),
      totalEntries: totals.totalEntries,
      totalFlow: totals.totalFlow,
      year,
    },
  };
};

module.exports = {
  getReportsData,
};
