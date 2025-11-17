const { checkSchema } = require('express-validator');

const transactionIdParams = checkSchema({
  id: {
    in: ['params'],
    isInt: {
      errorMessage: 'Transaction id must be an integer'
    },
    toInt: true
  }
});

const createTransactionSchema = checkSchema({
  account_id: {
    in: ['body'],
    exists: {
      errorMessage: 'account_id is required'
    },
    isInt: {
      errorMessage: 'account_id must be an integer'
    },
    toInt: true
  },
  category_id: {
    in: ['body'],
    optional: { nullable: true },
    isInt: {
      errorMessage: 'category_id must be an integer'
    },
    toInt: true
  },
  type: {
    in: ['body'],
    exists: {
      errorMessage: 'type is required'
    },
    isIn: {
      options: [['income', 'expense']],
      errorMessage: 'type must be income or expense'
    }
  },
  amount: {
    in: ['body'],
    exists: {
      errorMessage: 'amount is required'
    },
    isFloat: {
      options: { gt: 0 },
      errorMessage: 'amount must be a positive number'
    },
    toFloat: true
  },
  currency: {
    in: ['body'],
    exists: {
      errorMessage: 'currency is required'
    },
    isString: {
      errorMessage: 'currency must be a string'
    },
    trim: true,
    isLength: {
      options: { min: 3, max: 5 },
      errorMessage: 'currency must be 3-5 characters'
    }
  },
  date: {
    in: ['body'],
    exists: {
      errorMessage: 'date is required'
    },
    isISO8601: {
      errorMessage: 'date must be a valid ISO 8601 string'
    }
  },
  note: {
    in: ['body'],
    optional: { nullable: true },
    isString: {
      errorMessage: 'note must be a string'
    },
    trim: true,
    isLength: {
      options: { max: 500 },
      errorMessage: 'note must be 500 characters or fewer'
    }
  }
});

module.exports = {
  transactionIdParams,
  createTransactionSchema
};
