const http = require('http');
const app = require('./app');
const { convertAmount, RATE_MAP } = require('./services/currencyService');
const { getData, setData, persistData, closeDB } = require('./services/dataService');

let server;

// Note: Modular services created but not yet fully integrated
// Keeping original implementation for stability
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ENV } = require("./config/constants");

const dataPath = path.join(__dirname, "data.json");

const JWT_SECRET = ENV.JWT_SECRET;
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

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

const BANKS = [
  { id: 1, name: "Тинькофф" },
  { id: 2, name: "Сбербанк" },
  { id: 3, name: "Альфа-Банк" },
  { id: 4, name: "ВТБ" },
];

const MOCK_BANK_TRANSACTIONS = {
  1: [
    {
      external_id: "tnk_grocery_001",
      description: "Перекрёсток, Москва",
      type: "expense",
      amount: 2350.4,
      currency: "RUB",
      date: "2025-03-12",
      category: { name: "Продукты", kind: "expense" },
    },
    {
      external_id: "tnk_taxi_001",
      description: "Яндекс Такси",
      type: "expense",
      amount: 680.3,
      currency: "RUB",
      date: "2025-03-14",
      category: { name: "Транспорт", kind: "expense" },
    },
    {
      external_id: "tnk_salary_001",
      description: "Зарплата ООО \"Финтех\"",
      type: "income",
      amount: 180000,
      currency: "RUB",
      date: "2025-03-10",
      category: { name: "Зарплата", kind: "income" },
    },
  ],
  2: [
    {
      external_id: "sbr_coffee_001",
      description: "Кофейня DoubleB",
      type: "expense",
      amount: 18.5,
      currency: "EUR",
      date: "2025-03-11",
      category: { name: "Развлечения", kind: "expense" },
    },
    {
      external_id: "sbr_gas_001",
      description: "АЗС Лукойл",
      type: "expense",
      amount: 3200,
      currency: "RUB",
      date: "2025-03-09",
      category: { name: "Транспорт", kind: "expense" },
    },
    {
      external_id: "sbr_interest_001",
      description: "Проценты по вкладу",
      type: "income",
      amount: 52.75,
      currency: "EUR",
      date: "2025-03-08",
      category: { name: "Зарплата", kind: "income" },
    },
  ],
  3: [
    {
      external_id: "alf_market_001",
      description: "Продуктовый рынок",
      type: "expense",
      amount: 94.2,
      currency: "USD",
      date: "2025-02-27",
      category: { name: "Продукты", kind: "expense" },
    },
    {
      external_id: "alf_entertainment_001",
      description: "Кинотеатр \"Октябрь\"",
      type: "expense",
      amount: 1450,
      currency: "RUB",
      date: "2025-03-01",
      category: { name: "Развлечения", kind: "expense" },
    },
    {
      external_id: "alf_bonus_001",
      description: "Бонусы кэшбэк",
      type: "income",
      amount: 25.6,
      currency: "USD",
      date: "2025-03-05",
      category: { name: "Зарплата", kind: "income" },
    },
  ],
  4: [
    {
      external_id: "vtb_gift_001",
      description: "Подарок коллеге",
      type: "expense",
      amount: 4100,
      currency: "RUB",
      date: "2025-03-02",
      category: { name: "Подарки", kind: "expense" },
    },
    {
      external_id: "vtb_grocery_001",
      description: "Пятёрочка",
      type: "expense",
      amount: 2750.8,
      currency: "RUB",
      date: "2025-03-03",
      category: { name: "Продукты", kind: "expense" },
    },
    {
      external_id: "vtb_salary_001",
      description: "Аванс",
      type: "income",
      amount: 62000,
      currency: "RUB",
      date: "2025-03-15",
      category: { name: "Зарплата", kind: "income" },
    },
  ],
};

/**
 * Apply default structure to data object
 */
function applyDataDefaults(target) {
  if (!target.users) target.users = [];
  if (!target.accounts) target.accounts = [];
  if (!target.categories) target.categories = [];
  if (!target.transactions) target.transactions = [];
  if (!target.budgets) target.budgets = [];
  if (!target.goals) target.goals = [];
  if (!target.planned) target.planned = [];
  if (!target.subscriptions) target.subscriptions = [];
  if (!target.rules) target.rules = [];
  if (!target.recurring) target.recurring = [];
  if (!target.refreshTokens) target.refreshTokens = [];
  if (!target.tokenBlacklist) target.tokenBlacklist = [];
  if (!target.bankConnections) target.bankConnections = [];
  return target;
}

/**
 * Load data from JSON file
 */
function loadData() {
  try {
    if (!fs.existsSync(dataPath)) {
      return applyDataDefaults({});
    }
    const raw = fs.readFileSync(dataPath, "utf-8");
    const parsed = JSON.parse(raw);
    return applyDataDefaults(parsed);
  } catch (err) {
    // SECURITY: Log full error internally, but don't expose to clients
    console.error("Failed to load data file:", err.message, err.code || "");
    return applyDataDefaults({});
  }
}

let data = loadData();
const defaultUserId =
  data.users && data.users.length > 0 ? data.users[0].id : null;

// Ensure collections have user IDs
function ensureCollectionUserId(collection, fallbackUserId = null) {
  if (!Array.isArray(collection)) return;
  collection.forEach((item) => {
    if (item && typeof item === "object" && item.user_id == null) {
      item.user_id = fallbackUserId;
    }
  });
}

ensureCollectionUserId(data.accounts, defaultUserId);
ensureCollectionUserId(data.categories, defaultUserId);
ensureCollectionUserId(data.transactions, defaultUserId);
ensureCollectionUserId(data.budgets, defaultUserId);
ensureCollectionUserId(data.goals, defaultUserId);
ensureCollectionUserId(data.planned, defaultUserId);
ensureCollectionUserId(data.bankConnections, defaultUserId);
ensureCollectionUserId(data.subscriptions, defaultUserId);
ensureCollectionUserId(data.rules, defaultUserId);

/**
 * Сохраняет текущее состояние `data` в файл. Если происходит ошибка, выводит её в консоль.
 */
function persistData() {
  if (process.env.FINTRACKR_DISABLE_PERSIST === "true") {
    return;
  }
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    // SECURITY: Log error details server-side only
    console.error("Failed to write data file:", err.message, err.code || "");
  }
}

function getData() {
  return data;
}

function setData(nextData) {
  data = applyDataDefaults(nextData);
}

/**
 * Возвращает текст ответа в JSON с правильными заголовками
 */
function sendJson(res, obj, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, password_salt, ...rest } = user;
  return rest;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return header.split(/;\s*/).reduce((acc, part) => {
    const [key, ...v] = part.split("=");
    if (!key) return acc;
    acc[decodeURIComponent(key)] = decodeURIComponent(v.join("="));
    return acc;
  }, {});
}

function buildCookie(name, value, options = {}) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  cookie += `; Path=${options.path || "/"}`;
  if (options.httpOnly !== false) cookie += "; HttpOnly";
  if (options.maxAge != null) cookie += `; Max-Age=${options.maxAge}`;
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.secure) cookie += "; Secure";
  return cookie;
}

function setAuthCookies(res, tokens, options = {}) {
  const sameSite = options.sameSite || "Lax";
  const secure =
    options.secure !== undefined ? options.secure : COOKIE_SECURE;
  const cookies = [
    buildCookie("access_token", tokens.accessToken, {
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
      sameSite,
      secure,
    }),
    buildCookie("refresh_token", tokens.refreshToken, {
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
      sameSite,
      secure,
    }),
  ];
  res.setHeader("Set-Cookie", cookies);
}

function clearAuthCookies(res, options = {}) {
  const sameSite = options.sameSite || "Lax";
  const secure =
    options.secure !== undefined ? options.secure : COOKIE_SECURE;
  const cookies = [
    buildCookie("access_token", "", { maxAge: 0, sameSite, secure }),
    buildCookie("refresh_token", "", { maxAge: 0, sameSite, secure }),
  ];
  res.setHeader("Set-Cookie", cookies);
}

function cleanupTokenStores() {
  const now = Date.now();
  const refreshBefore = data.refreshTokens.length;
  data.refreshTokens = data.refreshTokens.filter((entry) => {
    return entry && entry.expiresAt && entry.expiresAt > now;
  });
  const blacklistBefore = data.tokenBlacklist.length;
  data.tokenBlacklist = data.tokenBlacklist.filter((entry) => {
    return entry && entry.expiresAt && entry.expiresAt > now;
  });
  if (
    refreshBefore !== data.refreshTokens.length ||
    blacklistBefore !== data.tokenBlacklist.length
  ) {
    persistData();
  }
}

function isTokenBlacklisted(token) {
  return data.tokenBlacklist.some((entry) => entry.token === token);
}

function addTokenToBlacklist(token, expiresAt) {
  if (!token) return;
  const expMs = expiresAt ? expiresAt : Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000;
  data.tokenBlacklist.push({ token, expiresAt: expMs });
  persistData();
}

function startServer(port = process.env.PORT || 3000) {
  if (server) return server;
  server = http.createServer(app);
  server.listen(port, () => {
    console.log(`FinTrackr server listening on http://localhost:${port}`);
  });
  return server;
}

function stopServer() {
  if (server) {
    server.close(() => {
      closeDB();
    });
    server = null;
  }
}

if (require.main === module) {
  startServer();

  const shutdown = () => {
    console.log('Shutting down server...');
    stopServer();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = {
  RATE_MAP,
  convertAmount,
  createServer,
  getData,
  setData,
  persistData,
  startServer,
  stopServer,
};
