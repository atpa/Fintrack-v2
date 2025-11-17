/**
 * Accounts routes
 * Handles CRUD operations for user accounts
 */

const express = require('express');
const router = express.Router();
const {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount
} = require('../controllers/accountsController');
const { authenticateRequest } = require('../middleware/auth');
const { ValidationError, AuthorizationError, NotFoundError } = require('../middleware/errorHandler');

// Apply authentication middleware to all routes
router.use(authenticateRequest);

/**
 * GET /api/accounts
 * Get all accounts for authenticated user
 */
router.get('/', listAccounts);

/**
 * GET /api/accounts/:id
 * Get specific account by ID
 */
router.get('/:id', getAccount);

/**
 * POST /api/accounts
 * Create new account
 */
router.post('/', createAccount);

/**
 * PUT /api/accounts/:id
 * Update account
 */
router.put('/:id', updateAccount);

/**
 * DELETE /api/accounts/:id
 * Delete account
 */
router.delete('/:id', deleteAccount);

module.exports = router;
