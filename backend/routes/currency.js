/**
 * Currency routes  
 * Handles currency conversion and rate queries
 */

const express = require('express');
const router = express.Router();
const { convertAmount, getExchangeRate } = require('../services/currencyService');
const { RATE_MAP, BANKS } = require('../config/constants');
const { ValidationError } = require('../middleware/errorHandler');

/**
 * GET /api/rates
 * Get exchange rate between two currencies
 */
router.get('/rates', (req, res, next) => {
  const { base, quote } = req.query;

  if (!base || !quote) {
    return next(new ValidationError('Base and quote currencies are required'));
  }

  const baseUpper = base.toUpperCase();
  const quoteUpper = quote.toUpperCase();

  if (!RATE_MAP[baseUpper] || !RATE_MAP[baseUpper][quoteUpper]) {
    return next(new ValidationError('Unsupported currency pair'));
  }

  const rate = RATE_MAP[baseUpper][quoteUpper];

  res.json({
    base: baseUpper,
    quote: quoteUpper,
    rate
  });
});

/**
 * GET /api/convert
 * Convert amount between currencies
 */
router.get('/convert', (req, res, next) => {
  const { amount, from, to } = req.query;

  if (!amount || !from || !to) {
    return next(new ValidationError('Amount, from, and to currencies are required'));
  }

  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();

  if (!RATE_MAP[fromUpper] || !RATE_MAP[fromUpper][toUpper]) {
    return next(new ValidationError('Unsupported currency pair'));
  }

  const result = convertAmount(Number(amount), fromUpper, toUpper);
  const rate = RATE_MAP[fromUpper][toUpper];

  res.json({
    from: fromUpper,
    to: toUpper,
    amount: Number(amount),
    rate,
    result
  });
});

/**
 * GET /api/banks
 * Get list of supported banks for sync
 */
router.get('/banks', (req, res) => {
  res.json(BANKS);
});

module.exports = router;
