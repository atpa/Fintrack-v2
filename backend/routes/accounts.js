/**
 * Accounts routes
 * Handles CRUD operations for user accounts
 */

const express = require('express');
const router = express.Router();
const {
  getAccountsByUserId,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
} = require('../services/dataService');
const { authenticateRequest } = require('../middleware/auth');
const { ValidationError, AuthorizationError, NotFoundError } = require('../middleware/errorHandler');

// Apply authentication middleware to all routes
router.use(authenticateRequest);

/**
 * GET /api/accounts
 * Get all accounts for authenticated user
 */
router.get('/', (req, res) => {
  const accounts = getAccountsByUserId(req.user.userId);
  res.json(accounts);
});

/**
 * GET /api/accounts/:id
 * Get specific account by ID
 */
router.get('/:id', (req, res, next) => {
  const account = getAccountById(req.params.id);

  if (!account) {
    return next(new NotFoundError('Account not found'));
  }

  if (account.user_id !== req.user.userId) {
    return next(new AuthorizationError('Access denied'));
  }

  return res.json(account);
});

/**
 * POST /api/accounts
 * Create new account
 */
router.post('/', (req, res, next) => {
  const { name, currency, balance } = req.body;

  if (!name || !currency) {
    return next(new ValidationError('Name and currency are required', [
      { field: 'name', message: 'Name is required' },
      { field: 'currency', message: 'Currency is required' },
    ]));
  }

  const accountId = createAccount(
    req.user.userId,
    name,
    currency,
    balance || 0
  );

  const account = getAccountById(accountId);
  return res.status(201).json(account);
});

/**
 * PUT /api/accounts/:id
 * Update account
 */
router.put('/:id', (req, res, next) => {
  const account = getAccountById(req.params.id);

  if (!account) {
    return next(new NotFoundError('Account not found'));
  }

  if (account.user_id !== req.user.userId) {
    return next(new AuthorizationError('Access denied'));
  }

  const { name, currency, balance } = req.body;
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (currency !== undefined) updates.currency = currency;
  if (balance !== undefined) updates.balance = balance;

  updateAccount(req.params.id, updates);

  const updatedAccount = getAccountById(req.params.id);
  return res.json(updatedAccount);
});

/**
 * DELETE /api/accounts/:id
 * Delete account
 */
router.delete('/:id', (req, res, next) => {
  const account = getAccountById(req.params.id);

  if (!account) {
    return next(new NotFoundError('Account not found'));
  }

  if (account.user_id !== req.user.userId) {
    return next(new AuthorizationError('Access denied'));
  }

  deleteAccount(req.params.id);
  return res.json({ success: true });
});

module.exports = router;
