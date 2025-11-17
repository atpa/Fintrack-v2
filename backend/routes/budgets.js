/**
 * Budgets routes
 * Handles CRUD operations for budgets
 */

const express = require('express');
const router = express.Router();
const {
  getBudgetsByUserId,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} = require('../services/dataService');
const { authenticateRequest } = require('../middleware/auth');
const { ValidationError, AuthorizationError, NotFoundError } = require('../middleware/errorHandler');

router.use(authenticateRequest);

router.get('/', (req, res) => {
  const budgets = getBudgetsByUserId(req.user.userId);
  res.json(budgets);
});

router.post('/', (req, res, next) => {
  const { category_id, month, limit_amount, type, percent, currency } = req.body;

  if (!category_id || !month) {
    return next(new ValidationError('Category and month are required', [
      { field: 'category_id', message: 'Category is required' },
      { field: 'month', message: 'Month is required' },
    ]));
  }

  const budgetId = createBudget(
    req.user.userId,
    category_id,
    month,
    limit_amount || 0,
    0,
    type || 'fixed',
    percent || null,
    currency || 'USD'
  );

  const budget = getBudgetById(budgetId);
  return res.status(201).json(budget);
});

router.put('/:id', (req, res, next) => {
  const budget = getBudgetById(req.params.id);

  if (!budget) {
    return next(new NotFoundError('Budget not found'));
  }

  if (budget.user_id !== req.user.userId) {
    return next(new AuthorizationError('Access denied'));
  }

  const { limit_amount, spent, type, percent, currency } = req.body;
  const updates = {};

  if (limit_amount !== undefined) updates.limit_amount = limit_amount;
  if (spent !== undefined) updates.spent = spent;
  if (type !== undefined) updates.type = type;
  if (percent !== undefined) updates.percent = percent;
  if (currency !== undefined) updates.currency = currency;

  updateBudget(req.params.id, updates);
  const updated = getBudgetById(req.params.id);

  return res.json(updated);
});

router.delete('/:id', (req, res, next) => {
  const budget = getBudgetById(req.params.id);

  if (!budget) {
    return next(new NotFoundError('Budget not found'));
  }

  if (budget.user_id !== req.user.userId) {
    return next(new AuthorizationError('Access denied'));
  }

  deleteBudget(req.params.id);
  return res.json({ success: true });
});

module.exports = router;
