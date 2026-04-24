const contactService = require('./contact.service');
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

const summarizeTransactions = transactions =>
  transactions.reduce(
    (summary, transaction) => {
      if (transaction.status === 'pending') {
        if (transaction.category === 'repayment') {
          if (transaction.type === 'gave') {
            summary.pendingRepaymentSent += Number(transaction.amount) || 0;
          } else {
            summary.pendingRepaymentReceived += Number(transaction.amount) || 0;
          }
        }

        return summary;
      }

      const amount = Number(transaction.amount) || 0;

      if (transaction.category === 'repayment') {
        if (transaction.type === 'took') {
          summary.collected += amount;
        } else {
          summary.repaid += amount;
        }
      } else if (transaction.type === 'took') {
        summary.took += amount;
      } else {
        summary.gave += amount;
      }

      summary.balance = summary.gave - summary.took;
      summary.remainingToReceive = Math.max(summary.gave - summary.collected, 0);
      summary.remainingToPay = Math.max(summary.took - summary.repaid, 0);

      return summary;
    },
    {
      balance: 0,
      collected: 0,
      currency: transactions[0]?.currency || 'PKR',
      gave: 0,
      pendingRepaymentReceived: 0,
      pendingRepaymentSent: 0,
      remainingToPay: 0,
      remainingToReceive: 0,
      repaid: 0,
      took: 0,
    },
  );

const getRecentActivityItem = transaction => ({
  id: transaction.id,
  name: transaction.counterpartyName,
  meta:
    transaction.category === 'repayment'
      ? transaction.status === 'pending'
        ? 'requested repayment of'
        : 'repaid'
      : transaction.type === 'gave'
        ? 'borrowed from you'
        : 'gave you back',
  amount: formatCurrencyValue(transaction.amount, transaction.currency),
  status:
    transaction.category === 'repayment'
      ? transaction.status === 'pending'
        ? 'Pending'
        : 'Repaid'
      : transaction.type === 'gave'
        ? 'Given'
        : 'Taken',
  variant:
    transaction.category === 'repayment'
      ? transaction.status === 'pending'
        ? 'taken'
        : 'receive'
      : transaction.type === 'gave'
        ? 'given'
        : 'receive',
});

const getDashboardData = async ownerId => {
  const [contacts, transactions] = await Promise.all([
    contactService.listContacts(ownerId),
    transactionService.listTransactions(ownerId),
  ]);

  const summary = summarizeTransactions(transactions);
  const pendingApprovals = transactions
    .filter(
      transaction =>
        transaction.category === 'repayment' &&
        transaction.status === 'pending' &&
        transaction.type === 'took',
    )
    .slice(0, 5)
    .map(transaction => ({
      amount: formatCurrencyValue(transaction.amount, transaction.currency),
      contactId: transaction.contactId,
      counterpartyName: transaction.counterpartyName,
      currency: transaction.currency,
      id: transaction.id,
      note: transaction.note,
      rawAmount: transaction.amount,
    }));

  const recentActivity = transactions.slice(0, 5).map(getRecentActivityItem);

  return {
    contacts: contacts.slice(0, 8).map(contact => ({
      contactId: contact.id,
      id: contact.contactUserId,
      name: contact.fullName,
      profilePhoto: contact.profilePhoto || '',
      variant: 'primary',
    })),
    pendingApprovals,
    recentActivity,
    summary: {
      borrowCount: transactions.filter(
        item => item.type === 'took' && item.category === 'loan',
      ).length,
      collectedAmount: formatCurrencyValue(summary.collected, summary.currency),
      currency: summary.currency,
      loanedAmount: formatCurrencyValue(summary.gave, summary.currency),
      remainingToRecoverAmount: formatCurrencyValue(
        summary.remainingToReceive,
        summary.currency,
      ),
      pendingApprovalsCount: pendingApprovals.length,
      pendingRepaymentReceived: formatCurrencyValue(
        summary.pendingRepaymentReceived,
        summary.currency,
      ),
      pendingRepaymentSent: formatCurrencyValue(
        summary.pendingRepaymentSent,
        summary.currency,
      ),
      rawCollectedAmount: summary.collected,
      rawLoanedAmount: summary.gave,
      rawRemainingToRecoverAmount: summary.remainingToReceive,
      receiveAmount: formatCurrencyValue(summary.remainingToReceive, summary.currency),
      receiveCount: transactions.filter(
        item => item.type === 'gave' && item.category === 'loan',
      ).length,
      repayAmount: formatCurrencyValue(summary.remainingToPay, summary.currency),
      totalTransactions: transactions.length,
    },
  };
};

module.exports = {
  getDashboardData,
};
