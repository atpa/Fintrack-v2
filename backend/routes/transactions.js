/**
 * Transactions routes
 * Handles CRUD operations for transactions
 */

const express = require('express');
const router = express.Router();
const {
  getTransactionsByUserId,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getAccountById,
  updateAccount,
  getBudgetByUserCategoryMonth,
  createBudget,
  updateBudget
} = require('../services/dataService');
const { authenticateRequest } = require('../middleware/auth');
const { convertAmount } = require('../services/currencyService');
const { ValidationError, AuthorizationError, NotFoundError } = require('../middleware/errorHandler');

router.use(authenticateRequest);

/**
 * GET /api/transactions
 * Get all transactions for authenticated user
 */
router.get('/', (req, res) => {
  const transactions = getTransactionsByUserId(req.user.userId);
  res.json(transactions);
});

/**
 * POST /api/transactions
 * Create new transaction and update account balance and budgets
 */
router.post('/', (req, res, next) => {
  const { account_id, category_id, type, amount, currency, date, note } = req.body;

  if (!account_id || !type || !amount || !currency || !date) {
    return next(new ValidationError('Missing required fields'));
  }

  if (!['income', 'expense'].includes(type)) {
    return next(new ValidationError('Type must be income or expense', [
      { field: 'type', message: 'Must be income or expense' },
    ]));
  }

  const account = getAccountById(account_id);
  if (!account || account.user_id !== req.user.userId) {
    return next(new AuthorizationError('Invalid account'));
  }

  const transactionId = createTransaction(
    req.user.userId,
    account_id,
    category_id || null,
    type,
    amount,
    currency,
    date,
    note || null
  );

  const convertedAmount = convertAmount(amount, currency, account.currency);
  const newBalance = type === 'income'
    ? account.balance + convertedAmount
    : account.balance - convertedAmount;

  updateAccount(account_id, { balance: newBalance });

  if (type === 'expense' && category_id) {
    const month = date.substring(0, 7); // Extract YYYY-MM
    let budget = getBudgetByUserCategoryMonth(req.user.userId, category_id, month);

    if (!budget) {
      createBudget(req.user.userId, category_id, month, 0, convertedAmount, 'fixed', null, currency);
    } else {
      const budgetAmount = convertAmount(amount, currency, budget.currency || 'USD');
      updateBudget(budget.id, { spent: budget.spent + budgetAmount });
    }
  }

  const transaction = getTransactionById(transactionId);
  return res.status(201).json(transaction);
});

/**
 * DELETE /api/transactions/:id
 * Delete transaction and revert account balance and budget
 */
router.delete('/:id', (req, res, next) => {
  const transaction = getTransactionById(req.params.id);

  if (!transaction) {
    return next(new NotFoundError('Transaction not found'));
  }

  if (transaction.user_id !== req.user.userId) {
    return next(new AuthorizationError('Access denied'));
  }

  const account = getAccountById(transaction.account_id);
  if (account) {
    const convertedAmount = convertAmount(transaction.amount, transaction.currency, account.currency);
    const newBalance = transaction.type === 'income'
      ? account.balance - convertedAmount
      : account.balance + convertedAmount;

    updateAccount(account.id, { balance: newBalance });
  }

  if (transaction.type === 'expense' && transaction.category_id) {
    const month = transaction.date.substring(0, 7);
    const budget = getBudgetByUserCategoryMonth(req.user.userId, transaction.category_id, month);

    if (budget) {
      const budgetAmount = convertAmount(transaction.amount, transaction.currency, budget.currency || 'USD');
      updateBudget(budget.id, { spent: Math.max(0, budget.spent - budgetAmount) });
    }
  }

  deleteTransaction(req.params.id);
  return res.json({ success: true });
});

module.exports = router;
