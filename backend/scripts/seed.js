/**
 * Idempotent seeding script for demo data
 * Populates users, accounts, categories, transactions, budgets, and currency rates
 */

const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { RATE_MAP } = require('../config/constants');
const { DEFAULT_CATEGORIES } = require('../config/defaultCategories');

const dbPath = process.env.FINTRACKR_DB_PATH || path.join(__dirname, '..', 'fintrackr.db');

function connect() {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Ensure currency_rates table exists for older databases
  db.exec(`
    CREATE TABLE IF NOT EXISTS currency_rates (
      base_currency TEXT NOT NULL,
      quote_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      as_of DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (base_currency, quote_currency)
    );

    CREATE INDEX IF NOT EXISTS idx_currency_rates_base ON currency_rates(base_currency);
  `);

  return db;
}

function resetTables(db) {
  const tables = ['transactions', 'budgets', 'accounts', 'categories', 'users', 'currency_rates'];

  const resetSeq = db.prepare(
    `DELETE FROM sqlite_sequence WHERE name IN (${tables.map(() => '?').join(',')})`
  );

  const reset = db.transaction(() => {
    db.exec('PRAGMA foreign_keys = OFF');
    tables.forEach((table) => {
      db.exec(`DELETE FROM ${table};`);
    });
    resetSeq.run(...tables);
    db.exec('PRAGMA foreign_keys = ON');
  });

  reset();
  console.log('🧹 Cleared existing demo data');
}

function seedUsers(db) {
  const users = [
    { name: 'Demo User', email: 'demo@fintrackr.com', password: 'demo123' },
    { name: 'Analyst User', email: 'analyst@fintrackr.com', password: 'insights123' },
  ];

  const insert = db.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (@name, @email, @password_hash)
  `);

  const create = db.transaction(() => {
    return users.map((user) => {
      const password_hash = bcrypt.hashSync(user.password, 10);
      const { lastInsertRowid } = insert.run({ ...user, password_hash });
      return { ...user, id: lastInsertRowid, password_hash };
    });
  });

  const created = create();
  console.log(`✅ Seeded ${created.length} users`);
  return created;
}

function seedCategories(db, users) {
  const categorySets = {
    income: ['Salary', 'Bonus', 'Investments', 'Refunds'],
    expense: ['Groceries', 'Housing', 'Transport', 'Healthcare', 'Travel', 'Utilities'],
  };

  const insert = db.prepare(`
    INSERT INTO categories (user_id, name)
    VALUES (@user_id, @name)
  `);

  const map = {};
  const create = db.transaction(() => {
    users.forEach((user) => {
      map[user.id] = { income: {}, expense: {}, all: {} };

      DEFAULT_CATEGORIES.forEach((name) => {
        if (map[user.id].all[name]) return;
        const { lastInsertRowid } = insert.run({ user_id: user.id, name });
        map[user.id].all[name] = lastInsertRowid;
      });

      Object.entries(categorySets).forEach(([kind, names]) => {
        names.forEach((name) => {
          if (map[user.id].all[name]) {
            map[user.id][kind][name] = map[user.id].all[name];
            return;
          }
          const { lastInsertRowid } = insert.run({ user_id: user.id, name });
          map[user.id][kind][name] = lastInsertRowid;
          map[user.id].all[name] = lastInsertRowid;
        });
      });
    });
  });

  create();
  console.log('✅ Seeded categories for each user (base + demo-specific)');
  return map;
}

function seedAccounts(db, users) {
  const accounts = [
    { userEmail: 'demo@fintrackr.com', name: 'Everyday Checking', currency: 'USD', balance: 3450.75 },
    { userEmail: 'demo@fintrackr.com', name: 'Savings Goal', currency: 'USD', balance: 10250.1 },
    { userEmail: 'demo@fintrackr.com', name: 'Travel Stash', currency: 'EUR', balance: 1800.4 },
    { userEmail: 'analyst@fintrackr.com', name: 'Analytics Ops', currency: 'USD', balance: 6200.9 },
    { userEmail: 'analyst@fintrackr.com', name: 'Freelance Wallet', currency: 'EUR', balance: 950.33 },
  ];

  const userByEmail = users.reduce((acc, user) => ({ ...acc, [user.email]: user.id }), {});
  const insert = db.prepare(`
    INSERT INTO accounts (user_id, name, currency, balance)
    VALUES (@user_id, @name, @currency, @balance)
  `);

  const create = db.transaction(() => {
    return accounts.map((account) => {
      const user_id = userByEmail[account.userEmail];
      const { lastInsertRowid } = insert.run({ ...account, user_id });
      return { ...account, id: lastInsertRowid, user_id };
    });
  });

  const created = create();
  console.log(`✅ Seeded ${created.length} accounts`);
  return created;
}

function seedBudgets(db, users, categoryMap) {
  const month = new Date();
  const fmtMonth = (offset = 0) => {
    const d = new Date(month);
    d.setMonth(d.getMonth() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const budgets = [
    {
      userEmail: 'demo@fintrackr.com',
      category: categoryMap[users.find((u) => u.email === 'demo@fintrackr.com').id].expense.Groceries,
      month: fmtMonth(0),
      limit_amount: 650,
      spent: 210,
      type: 'fixed',
      currency: 'USD',
    },
    {
      userEmail: 'demo@fintrackr.com',
      category: categoryMap[users.find((u) => u.email === 'demo@fintrackr.com').id].expense.Travel,
      month: fmtMonth(1),
      limit_amount: 1200,
      spent: 0,
      type: 'fixed',
      currency: 'EUR',
    },
    {
      userEmail: 'analyst@fintrackr.com',
      category: categoryMap[users.find((u) => u.email === 'analyst@fintrackr.com').id].expense.Transport,
      month: fmtMonth(-1),
      limit_amount: 180,
      spent: 90,
      type: 'fixed',
      currency: 'EUR',
    },
    {
      userEmail: 'analyst@fintrackr.com',
      category: categoryMap[users.find((u) => u.email === 'analyst@fintrackr.com').id].income.Bonus,
      month: fmtMonth(0),
      limit_amount: 2000,
      spent: 0,
      type: 'variable',
      percent: 15,
      currency: 'USD',
    },
  ];

  const userByEmail = users.reduce((acc, user) => ({ ...acc, [user.email]: user.id }), {});
  const insert = db.prepare(`
    INSERT INTO budgets (user_id, category_id, month, limit_amount, spent, type, percent, currency)
    VALUES (@user_id, @category_id, @month, @limit_amount, @spent, @type, @percent, @currency)
  `);

  const create = db.transaction(() => {
    budgets.forEach((budget) => {
      insert.run({
        user_id: userByEmail[budget.userEmail],
        category_id: budget.category,
        month: budget.month,
        limit_amount: budget.limit_amount,
        spent: budget.spent,
        type: budget.type,
        percent: budget.percent || null,
        currency: budget.currency,
      });
    });
  });

  create();
  console.log(`✅ Seeded ${budgets.length} budgets across months`);
}

function seedTransactions(db, users, accounts, categoryMap) {
  const userByEmail = users.reduce((acc, user) => ({ ...acc, [user.email]: user.id }), {});
  const accountByName = accounts.reduce((acc, account) => ({ ...acc, [account.name]: account }), {});

  const today = new Date();
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };

  const tx = [
    {
      userEmail: 'demo@fintrackr.com',
      account: 'Everyday Checking',
      category: categoryMap[userByEmail['demo@fintrackr.com']].income.Salary,
      type: 'income',
      amount: 5200,
      currency: 'USD',
      date: daysAgo(15),
      note: 'Monthly payroll',
    },
    {
      userEmail: 'demo@fintrackr.com',
      account: 'Savings Goal',
      category: categoryMap[userByEmail['demo@fintrackr.com']].income.Bonus,
      type: 'income',
      amount: 800,
      currency: 'USD',
      date: daysAgo(40),
      note: 'Quarterly bonus',
    },
    {
      userEmail: 'demo@fintrackr.com',
      account: 'Everyday Checking',
      category: categoryMap[userByEmail['demo@fintrackr.com']].expense.Groceries,
      type: 'expense',
      amount: 92.45,
      currency: 'USD',
      date: daysAgo(3),
      note: 'Weekly supermarket run',
    },
    {
      userEmail: 'demo@fintrackr.com',
      account: 'Everyday Checking',
      category: categoryMap[userByEmail['demo@fintrackr.com']].expense.Housing,
      type: 'expense',
      amount: 1450,
      currency: 'USD',
      date: daysAgo(2),
      note: 'Rent with utilities included',
    },
    {
      userEmail: 'demo@fintrackr.com',
      account: 'Travel Stash',
      category: categoryMap[userByEmail['demo@fintrackr.com']].expense.Travel,
      type: 'expense',
      amount: 320.75,
      currency: 'EUR',
      date: daysAgo(7),
      note: 'Train + hotel reservation',
    },
    {
      userEmail: 'demo@fintrackr.com',
      account: 'Everyday Checking',
      category: categoryMap[userByEmail['demo@fintrackr.com']].expense.Healthcare,
      type: 'expense',
      amount: 610.5,
      currency: 'USD',
      date: daysAgo(25),
      note: 'Specialist visit and lab work',
    },
    {
      userEmail: 'demo@fintrackr.com',
      account: 'Savings Goal',
      category: categoryMap[userByEmail['demo@fintrackr.com']].expense.Utilities,
      type: 'expense',
      amount: 185.2,
      currency: 'USD',
      date: daysAgo(10),
      note: 'Electric + internet bundle',
    },
    {
      userEmail: 'analyst@fintrackr.com',
      account: 'Analytics Ops',
      category: categoryMap[userByEmail['analyst@fintrackr.com']].income.Investments,
      type: 'income',
      amount: 430.35,
      currency: 'USD',
      date: daysAgo(5),
      note: 'Index fund dividend',
    },
    {
      userEmail: 'analyst@fintrackr.com',
      account: 'Analytics Ops',
      category: categoryMap[userByEmail['analyst@fintrackr.com']].expense.Transport,
      type: 'expense',
      amount: 42.1,
      currency: 'USD',
      date: daysAgo(1),
      note: 'Rideshare during storm (peak)',
    },
    {
      userEmail: 'analyst@fintrackr.com',
      account: 'Freelance Wallet',
      category: categoryMap[userByEmail['analyst@fintrackr.com']].expense.Travel,
      type: 'expense',
      amount: 715.6,
      currency: 'EUR',
      date: daysAgo(60),
      note: 'Conference flights paid early',
    },
    {
      userEmail: 'analyst@fintrackr.com',
      account: 'Freelance Wallet',
      category: categoryMap[userByEmail['analyst@fintrackr.com']].income.Refunds,
      type: 'income',
      amount: 120.45,
      currency: 'EUR',
      date: daysAgo(-5),
      note: 'Travel overpayment refund (future-dated)',
    },
  ];

  const insert = db.prepare(`
    INSERT INTO transactions (user_id, account_id, category_id, type, amount, currency, date, note)
    VALUES (@user_id, @account_id, @category_id, @type, @amount, @currency, @date, @note)
  `);

  const create = db.transaction(() => {
    tx.forEach((row) => {
      insert.run({
        user_id: userByEmail[row.userEmail],
        account_id: accountByName[row.account].id,
        category_id: row.category,
        type: row.type,
        amount: row.amount,
        currency: row.currency,
        date: row.date,
        note: row.note,
      });
    });
  });

  create();
  console.log(`✅ Seeded ${tx.length} transactions with cross-currency coverage`);
}

function seedCurrencyRates(db) {
  const rows = [];
  Object.entries(RATE_MAP).forEach(([base, quotes]) => {
    Object.entries(quotes).forEach(([quote, rate]) => {
      rows.push({ base, quote, rate });
    });
  });

  const insert = db.prepare(`
    INSERT INTO currency_rates (base_currency, quote_currency, rate, as_of)
    VALUES (@base_currency, @quote_currency, @rate, CURRENT_TIMESTAMP)
    ON CONFLICT(base_currency, quote_currency) DO UPDATE SET
      rate=excluded.rate,
      as_of=CURRENT_TIMESTAMP
  `);

  const upsert = db.transaction(() => {
    rows.forEach((row) => {
      insert.run({
        base_currency: row.base,
        quote_currency: row.quote,
        rate: row.rate,
      });
    });
  });

  upsert();
  console.log(`✅ Upserted ${rows.length} currency rate pairs`);
}

function main() {
  const db = connect();
  resetTables(db);

  const users = seedUsers(db);
  const categories = seedCategories(db, users);
  const accounts = seedAccounts(db, users);
  seedBudgets(db, users, categories);
  seedTransactions(db, users, accounts, categories);
  seedCurrencyRates(db);

  db.close();
  console.log('🎉 Seeding completed successfully');
}

main();
