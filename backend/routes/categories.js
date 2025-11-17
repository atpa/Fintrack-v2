/**
 * Categories routes
 * Handles CRUD operations for transaction categories
 */

const express = require('express');
const router = express.Router();
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoriesController');
const { authenticateRequest } = require('../middleware/auth');

router.use(authenticateRequest);

/**
 * GET /api/categories
 * Get all categories for authenticated user
 */
router.get('/', listCategories);

/**
 * POST /api/categories
 * Create new category
 */
router.post('/', createCategory);

/**
 * PUT /api/categories/:id
 * Update category
 */
router.put('/:id', updateCategory);

/**
 * DELETE /api/categories/:id
 * Delete category
 */
router.delete('/:id', deleteCategory);

module.exports = router;
