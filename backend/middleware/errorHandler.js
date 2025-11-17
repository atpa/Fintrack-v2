/**
 * Centralized error handling middleware
 * Normalizes errors into a consistent { message, code, details? } shape
 */

const STATUS_CODE_TO_CODE = {
  400: 'VALIDATION_ERROR',
  401: 'AUTHENTICATION_ERROR',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
};

class AppError extends Error {
  constructor(message, {
    statusCode = 500,
    code = STATUS_CODE_TO_CODE[statusCode] || 'INTERNAL_ERROR',
    details = undefined,
    isOperational = true,
  } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { statusCode: 401, code: 'AUTHENTICATION_ERROR' });
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, { statusCode: 403, code: 'FORBIDDEN' });
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { statusCode: 404, code: 'NOT_FOUND' });
  }
}

function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.type === 'entity.parse.failed') {
    return new ValidationError('Invalid JSON payload');
  }

  if (typeof error?.status === 'number' || typeof error?.statusCode === 'number') {
    const statusCode = error.status || error.statusCode;
    return new AppError(error.message || 'Request failed', {
      statusCode,
      code: error.code || STATUS_CODE_TO_CODE[statusCode] || 'INTERNAL_ERROR',
      isOperational: error.isOperational !== false,
    });
  }

  return new AppError('Internal server error', { isOperational: false });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const normalized = normalizeError(err);

  if (process.env.NODE_ENV !== 'production' || !normalized.isOperational) {
    // eslint-disable-next-line no-console
    console.error('[error]', normalized); // Useful for troubleshooting
  }

  const payload = {
    message: normalized.message,
    code: normalized.code,
  };

  if (normalized.details) {
    payload.details = normalized.details;
  }

  res.status(normalized.statusCode || 500).json(payload);
}

function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl || req.url} not found`));
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  errorHandler,
  notFoundHandler,
};
