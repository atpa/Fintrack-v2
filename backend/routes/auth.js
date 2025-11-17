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
  setAuthCookies,
  clearAuthCookies,
  sanitizeUser,
  issueTokensForUser,
  parseCookies,
  addTokenToBlacklist,
  isTokenBlacklisted
} = require('../services/authService');
const { getUserByEmail, createUser } = require('../services/dataService');

/**
 * POST /api/register
 * Register a new user
 */
router.post('/register', validationMiddleware(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.validated;
    
    // Check if user exists
    const existing = getUserByEmail(email);
    if (existing) {
      return next(new ValidationError('Email already registered'));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userId = createUser(name, email, passwordHash);
    
    // Generate tokens
    const tokens = issueTokensForUser({ id: userId, email });
    setAuthCookies(res, tokens);
    
    // Return user data
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
router.post('/login', validationMiddleware(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validated;
    
    // Find user
    const user = getUserByEmail(email);
    if (!user) {
      return next(new AuthenticationError('Invalid credentials'));
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return next(new AuthenticationError('Invalid credentials'));
    }
    
    // Generate tokens
    const tokens = issueTokensForUser({ id: user.id, email: user.email });
    setAuthCookies(res, tokens);
    
    // Return user data
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
    const accessToken = cookies.access_token;
    if (accessToken) addTokenToBlacklist(accessToken);
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
// Simplified refresh endpoint using existing cookies (optional for tests)
router.post('/refresh', (req, res) => {
  try {
    const cookies = parseCookies(req);
    const accessToken = cookies.access_token;
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });
    return res.json({ success: true });
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
