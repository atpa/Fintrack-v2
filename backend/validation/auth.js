const { checkSchema } = require('express-validator');

const registerSchema = checkSchema({
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
  },
  email: {
    in: ['body'],
    exists: {
      errorMessage: 'Email is required'
    },
    isEmail: {
      errorMessage: 'Email must be valid'
    },
    normalizeEmail: true
  },
  password: {
    in: ['body'],
    exists: {
      errorMessage: 'Password is required'
    },
    isString: {
      errorMessage: 'Password must be a string'
    },
    isLength: {
      options: { min: 6 },
      errorMessage: 'Password must be at least 6 characters'
    }
  }
});

const loginSchema = checkSchema({
  email: {
    in: ['body'],
    exists: {
      errorMessage: 'Email is required'
    },
    isEmail: {
      errorMessage: 'Email must be valid'
    },
    normalizeEmail: true
  },
  password: {
    in: ['body'],
    exists: {
      errorMessage: 'Password is required'
    },
    isString: {
      errorMessage: 'Password must be a string'
    }
  }
});

module.exports = {
  registerSchema,
  loginSchema
};
