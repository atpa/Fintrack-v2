const { checkSchema } = require('express-validator');

const categoryIdParams = checkSchema({
  id: {
    in: ['params'],
    isInt: {
      errorMessage: 'Category id must be an integer'
    },
    toInt: true
  }
});

const createCategorySchema = checkSchema({
  name: {
    in: ['body'],
    exists: {
      errorMessage: 'Name is required'
    },
    isString: {
      errorMessage: 'Name must be a string'
    },
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'Name must be between 2 and 100 characters'
    }
  }
});

const updateCategorySchema = checkSchema({
  name: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Name must be a string'
    },
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: 'Name must be between 2 and 100 characters'
    }
  }
});

module.exports = {
  categoryIdParams,
  createCategorySchema,
  updateCategorySchema
};
