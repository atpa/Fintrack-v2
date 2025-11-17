const { checkSchema } = require('express-validator');

const accountIdParams = checkSchema({
  id: {
    in: ['params'],
    isInt: {
      errorMessage: 'Account id must be an integer'
    },
    toInt: true
  }
});

const createAccountSchema = checkSchema({
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
  currency: {
    in: ['body'],
    exists: {
      errorMessage: 'Currency is required'
    },
    isString: {
      errorMessage: 'Currency must be a string'
    },
    trim: true,
    isLength: {
      options: { min: 3, max: 5 },
      errorMessage: 'Currency must be 3-5 characters'
    }
  },
  balance: {
    in: ['body'],
    optional: true,
    isFloat: {
      errorMessage: 'Balance must be a number'
    },
    toFloat: true
  }
});

const updateAccountSchema = checkSchema({
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
  },
  currency: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Currency must be a string'
    },
    trim: true,
    isLength: {
      options: { min: 3, max: 5 },
      errorMessage: 'Currency must be 3-5 characters'
    }
  },
  balance: {
    in: ['body'],
    optional: true,
    isFloat: {
      errorMessage: 'Balance must be a number'
    },
    toFloat: true
  }
});

module.exports = {
  accountIdParams,
  createAccountSchema,
  updateAccountSchema
};
