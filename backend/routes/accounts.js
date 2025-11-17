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
const { validationMiddleware } = require('../middleware/validation');
const { accountIdParams, createAccountSchema, updateAccountSchema } = require('../validation/accounts');

// Apply authentication middleware to all routes
router.use(authenticateRequest);

/**
 * GET /api/accounts
 * Get all accounts for authenticated user
 */
router.get('/', (req, res) => {
  try {
    const accounts = getAccountsByUserId(req.user.userId);
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/accounts/:id
 * Get specific account by ID
 */
router.get('/:id', validationMiddleware(accountIdParams), (req, res) => {
  try {
    const account = getAccountById(req.validated.id);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    if (account.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(account);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/accounts
 * Create new account
 */
router.post('/', validationMiddleware(createAccountSchema), (req, res) => {
  try {
    const { name, currency, balance } = req.validated;
    
    const accountId = createAccount(
      req.user.userId,
      name,
      currency,
      balance ?? 0
    );

    const account = getAccountById(accountId);
    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/accounts/:id
 * Update account
 */
router.put('/:id', validationMiddleware([...accountIdParams, ...updateAccountSchema]), (req, res) => {
  try {
    const account = getAccountById(req.validated.id);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    if (account.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, currency, balance } = req.validated;
    const updates = {};
    
    if (name !== undefined) updates.name = name;
    if (currency !== undefined) updates.currency = currency;
    if (balance !== undefined) updates.balance = balance;
    
    updateAccount(req.validated.id, updates);

    const updatedAccount = getAccountById(req.validated.id);
    res.json(updatedAccount);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/accounts/:id
 * Delete account
 */
router.delete('/:id', validationMiddleware(accountIdParams), (req, res) => {
  try {
    const account = getAccountById(req.validated.id);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    if (account.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    deleteAccount(req.validated.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
