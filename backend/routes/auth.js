/**
 * Authentication routes
 * Handles user registration, login, logout, and token refresh
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationMiddleware } = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../validation/auth');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  sanitizeUser
} = require('../services/authService');
const {
  getUserByEmail,
  createUser,
  getRefreshToken,
  createRefreshToken,
  deleteRefreshToken,
  addTokenToBlacklist,
  isTokenBlacklisted
} = require('../services/dataService');
const { parseCookies } = require('../services/authService');
const { ValidationError, AuthenticationError } = require('../middleware/errorHandler');

/**
 * POST /api/register
 * Register a new user
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new ValidationError('Name, email, and password are required'));
    }

    if (password.length < 6) {
      return next(new ValidationError('Password must be at least 6 characters'));
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return next(new ValidationError('Email already registered'));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userId = createUser(name, email, passwordHash);

    const accessToken = generateAccessToken({ userId, email });
    const refreshToken = generateRefreshToken();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    createRefreshToken(userId, refreshToken, expiresAt);
    setAuthCookies(res, { accessToken, refreshToken });

    res.status(201).json({
      user: { id: userId, name, email }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/login
 * Authenticate user and return tokens
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError('Email and password are required'));
    }

    const user = getUserByEmail(email);
    if (!user) {
      return next(new AuthenticationError('Invalid credentials'));
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return next(new AuthenticationError('Invalid credentials'));
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    createRefreshToken(user.id, refreshToken, expiresAt);
    setAuthCookies(res, { accessToken, refreshToken });

    res.json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/logout
 * Logout user and invalidate tokens
 */
router.post('/logout', (req, res, next) => {
  try {
    const cookies = parseCookies(req);
    const refreshToken = cookies.refresh_token;
    const accessToken = cookies.access_token;

    if (refreshToken) {
      deleteRefreshToken(refreshToken);
    }

    if (accessToken) {
      addTokenToBlacklist(accessToken);
    }

    clearAuthCookies(res);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', (req, res, next) => {
  try {
    const cookies = parseCookies(req);
    const refreshToken = cookies.refresh_token;

    if (!refreshToken) {
      return next(new AuthenticationError('No refresh token'));
    }

    const tokenRecord = getRefreshToken(refreshToken);
    if (!tokenRecord || tokenRecord.expires_at < Date.now()) {
      clearAuthCookies(res);
      return next(new AuthenticationError('Invalid or expired refresh token'));
    }

    const user = require('../services/dataService').getUserById(tokenRecord.user_id);
    if (!user) {
      return next(new AuthenticationError('User not found'));
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    setAuthCookies(res, { accessToken, refreshToken });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/session
 * Check if user is authenticated and return user data
 */
router.get('/session', (req, res, next) => {
  try {
    const cookies = parseCookies(req);
    const accessToken = cookies.access_token;

    if (!accessToken) {
      return next(new AuthenticationError('Not authenticated'));
    }

    if (isTokenBlacklisted(accessToken)) {
      clearAuthCookies(res);
      return next(new AuthenticationError('Token invalidated'));
    }

    const jwt = require('jsonwebtoken');
    const { ENV } = require('../config/constants');

    try {
      const payload = jwt.verify(accessToken, ENV.JWT_SECRET);
      const user = require('../services/dataService').getUserById(payload.userId);

      if (!user) {
        return next(new AuthenticationError('User not found'));
      }

      return res.json({ user: sanitizeUser(user) });
    } catch (jwtError) {
      const refreshToken = cookies.refresh_token;
      if (refreshToken) {
        const tokenRecord = getRefreshToken(refreshToken);
        if (tokenRecord && tokenRecord.expires_at > Date.now()) {
          const user = require('../services/dataService').getUserById(tokenRecord.user_id);
          if (user) {
            const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });
            setAuthCookies(res, { accessToken: newAccessToken, refreshToken });
            return res.json({ user: sanitizeUser(user) });
          }
        }
      }

      clearAuthCookies(res);
      return next(new AuthenticationError('Token expired'));
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
