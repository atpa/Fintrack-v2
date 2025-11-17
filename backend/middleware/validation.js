const { validationResult, matchedData } = require('express-validator');

function validationMiddleware(validations) {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(({ msg, param, path, location, value }) => ({
          field: param || path,
          location,
          message: msg,
          value
        }))
      });
    }

    const cleaned = matchedData(req, { locations: ['body', 'params', 'query'], includeOptionals: true });
    req.validated = cleaned;

    // Keep request objects in sync with sanitized values
    req.body = { ...req.body, ...matchedData(req, { locations: ['body'], includeOptionals: true }) };
    req.params = { ...req.params, ...matchedData(req, { locations: ['params'], includeOptionals: true }) };
    req.query = { ...req.query, ...matchedData(req, { locations: ['query'], includeOptionals: true }) };

    return next();
  };
}

module.exports = { validationMiddleware };
