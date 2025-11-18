const {
  getCategoriesByUserId,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../services/dataService');

function listCategories(req, res) {
  try {
    const categories = getCategoriesByUserId(req.user.userId);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function createCategoryHandler(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const categoryId = createCategory(req.user.userId, name);
    const category = getCategoryById(categoryId);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function updateCategoryHandler(req, res) {
  try {
    const category = getCategoryById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;

    updateCategory(req.params.id, updates);

    const updatedCategory = getCategoryById(req.params.id);
    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function deleteCategoryHandler(req, res) {
  try {
    const category = getCategoryById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    deleteCategory(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  listCategories,
  createCategory: createCategoryHandler,
  updateCategory: updateCategoryHandler,
  deleteCategory: deleteCategoryHandler,
};
