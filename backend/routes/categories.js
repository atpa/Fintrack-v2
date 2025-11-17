/**
 * Categories routes
 * Handles CRUD operations for transaction categories
 */

const express = require('express');
const router = express.Router();
const {
  getCategoriesByUserId,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../services/dataService');
const { authenticateRequest } = require('../middleware/auth');
const { ValidationError, AuthorizationError, NotFoundError } = require('../middleware/errorHandler');

router.use(authenticateRequest);

/**
 * GET /api/categories
 * Get all categories for authenticated user
 */
router.get('/', (req, res) => {
  const categories = getCategoriesByUserId(req.user.userId);
  res.json(categories);
});

/**
 * POST /api/categories
 * Create new category
 */
router.post('/', (req, res, next) => {
  const { name, kind } = req.body;

  if (!name || !kind) {
    return next(new ValidationError('Name and kind are required', [
      { field: 'name', message: 'Name is required' },
      { field: 'kind', message: 'Kind is required' },
    ]));
  }

  if (!['income', 'expense'].includes(kind)) {
    return next(new ValidationError('Kind must be income or expense', [
      { field: 'kind', message: 'Must be income or expense' },
    ]));
  }

  const categoryId = createCategory(req.user.userId, name, kind);
  const category = getCategoryById(categoryId);

  return res.status(201).json(category);
});

/**
 * PUT /api/categories/:id
 * Update category
 */
router.put('/:id', (req, res, next) => {
  const category = getCategoryById(req.params.id);

  if (!category) {
    return next(new NotFoundError('Category not found'));
  }

  if (category.user_id !== req.user.userId) {
    return next(new AuthorizationError('Access denied'));
  }

  const { name, kind } = req.body;
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (kind !== undefined) {
    if (!['income', 'expense'].includes(kind)) {
      return next(new ValidationError('Kind must be income or expense', [
        { field: 'kind', message: 'Must be income or expense' },
      ]));
    }
    updates.kind = kind;
  }

  updateCategory(req.params.id, updates);
  const updated = getCategoryById(req.params.id);

  return res.json(updated);
});

/**
 * DELETE /api/categories/:id
 * Delete category
 */
router.delete('/:id', (req, res, next) => {
  const category = getCategoryById(req.params.id);

  if (!category) {
    return next(new NotFoundError('Category not found'));
  }

  if (category.user_id !== req.user.userId) {
    return next(new AuthorizationError('Access denied'));
  }

  deleteCategory(req.params.id);
  return res.json({ success: true });
});

module.exports = router;
