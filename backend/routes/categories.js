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
const { validationMiddleware } = require('../middleware/validation');
const { categoryIdParams, createCategorySchema, updateCategorySchema } = require('../validation/categories');

router.use(authenticateRequest);

/**
 * GET /api/categories
 * Get all categories for authenticated user
 */
router.get('/', (req, res) => {
  try {
    const categories = getCategoriesByUserId(req.user.userId);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/categories
 * Create new category
 */
router.post('/', validationMiddleware(createCategorySchema), (req, res) => {
  try {
    const { name, kind } = req.validated;
    
    const categoryId = createCategory(req.user.userId, name, kind);
    const category = getCategoryById(categoryId);
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/categories/:id
 * Update category
 */
router.put('/:id', validationMiddleware([...categoryIdParams, ...updateCategorySchema]), (req, res) => {
  try {
    const category = getCategoryById(req.validated.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    if (category.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, kind } = req.validated;
    const updates = {};
    
    if (name !== undefined) updates.name = name;
    if (kind !== undefined) {
      updates.kind = kind;
    }
    
    updateCategory(req.validated.id, updates);
    const updated = getCategoryById(req.validated.id);
    
    res.json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/categories/:id
 * Delete category
 */
router.delete('/:id', validationMiddleware(categoryIdParams), (req, res) => {
  try {
    const category = getCategoryById(req.validated.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    if (category.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    deleteCategory(req.validated.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
