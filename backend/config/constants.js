/**
 * Application constants
 * Centralized configuration and constant values
 */

// Environment configuration
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    if (secret === "dev-secret-change") {
      console.warn("SECURITY WARNING: Replace default JWT secret before production deployment");
    }
    return secret;
  }

  if (process.env.NODE_ENV === "test" || process.env.FINTRACKR_DISABLE_PERSIST === "true") {
    return "test-secret";
  }

  console.warn("SECURITY WARNING: Falling back to default JWT secret for local development. Set JWT_SECRET in .env before production.");
  return "dev-secret-change";
};

const ENV = {
  JWT_SECRET: getJwtSecret(),
  PORT: process.env.PORT || 3000,
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === "production" ? "Strict" : "Lax"),
  DISABLE_PERSIST: process.env.FINTRACKR_DISABLE_PERSIST === "true",
};

// Token configuration
const TOKEN_CONFIG = {
  ACCESS_TTL_SECONDS: 15 * 60, // 15 minutes
  REFRESH_TTL_SECONDS: 7 * 24 * 60 * 60, // 7 days
};

// MIME types for static file serving
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

// Supported banks (mock data for MVP)
const BANKS = [
  { id: 1, name: "РўРёРЅСЊРєРѕС„С„" },
  { id: 2, name: "РЎР±РµСЂР±Р°РЅРє" },
  { id: 3, name: "РђР»СЊС„Р°-Р‘Р°РЅРє" },
  { id: 4, name: "Р’РўР‘" },
];

// Currency exchange rates (relative to USD)
const RATE_MAP = {
  USD: { USD: 1, EUR: 0.94, PLN: 4.5, RUB: 90 },
  EUR: { USD: 1.06, EUR: 1, PLN: 4.8, RUB: 95 },
  PLN: { USD: 0.22, EUR: 0.21, PLN: 1, RUB: 20 },
  RUB: { USD: 0.011, EUR: 0.0105, PLN: 0.05, RUB: 1 },
};

// Mock bank transactions for testing
const MOCK_BANK_TRANSACTIONS = {
  1: [
    {
      external_id: "tnk_grocery_001",
      description: "РџРµСЂРµРєСЂС‘СЃС‚РѕРє, РњРѕСЃРєРІР°",
      type: "expense",
      amount: 2350.4,
      currency: "RUB",
      date: "2025-03-12",
      category: { name: "РџСЂРѕРґСѓРєС‚С‹"  },
    },
    {
      external_id: "tnk_taxi_001",
      description: "РЇРЅРґРµРєСЃ РўР°РєСЃРё",
      type: "expense",
      amount: 680.3,
      currency: "RUB",
      date: "2025-03-14",
      category: { name: "РўСЂР°РЅСЃРїРѕСЂС‚"  },
    },
  ],
  2: [
    {
      external_id: "sber_salary_001",
      description: "Р—Р°СЂРїР»Р°С‚Р°",
      type: "income",
      amount: 150000,
      currency: "RUB",
      date: "2025-03-01",
      category: { name: "Р—Р°СЂРїР»Р°С‚Р°"  },
    },
  ],
};

module.exports = {
  ENV,
  TOKEN_CONFIG,
  MIME_TYPES,
  BANKS,
  RATE_MAP,
  MOCK_BANK_TRANSACTIONS,
};
