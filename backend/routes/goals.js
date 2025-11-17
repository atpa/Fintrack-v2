/**
 * Goals routes
 * Handles CRUD operations for financial goals
 */

const express = require('express');
const router = express.Router();
const {
  getGoalsByUserId,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal
} = require('../services/dataService');
const { authenticateRequest } = require('../middleware/auth');
const { ValidationError, AuthorizationError, NotFoundError } = require('../middleware/errorHandler');

router.use(authenticateRequest);

router.get('/', (req, res) => {
  const goals = getGoalsByUserId(req.user.userId);
  res.json(goals);
});

router.post('/', (req, res, next) => {
  const { title, target_amount, current_amount, deadline } = req.body;

  if (!title || !target_amount) {
    return next(new ValidationError('Title and target amount are required', [
      { field: 'title', message: 'Title is required' },
      { field: 'target_amount', message: 'Target amount is required' },
    ]));
  }

  const goalId = createGoal(
    req.user.userId,
    title,
    target_amount,
    current_amount || 0,
    deadline || null
  );

  const goal = getGoalById(goalId);
  return res.status(201).json(goal);
});

router.put('/:id', (req, res, next) => {
  const goal = getGoalById(req.params.id);

  if (!goal) {
    return next(new NotFoundError('Goal not found'));
  }

  if (goal.user_id !== req.user.userId) {
    return next(new AuthorizationError('Access denied'));
  }

  const { title, target_amount, current_amount, deadline } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (target_amount !== undefined) updates.target_amount = target_amount;
  if (current_amount !== undefined) updates.current_amount = current_amount;
  if (deadline !== undefined) updates.deadline = deadline;

  updateGoal(req.params.id, updates);
  const updated = getGoalById(req.params.id);

  return res.json(updated);
});

router.delete('/:id', (req, res, next) => {
  const goal = getGoalById(req.params.id);

  if (!goal) {
    return next(new NotFoundError('Goal not found'));
  }

  if (goal.user_id !== req.user.userId) {
    return next(new AuthorizationError('Access denied'));
  }

  deleteGoal(req.params.id);
  return res.json({ success: true });
});

module.exports = router;
