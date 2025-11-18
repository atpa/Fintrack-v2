# FinTrackr Database Schema Documentation

## Overview

FinTrackr uses SQLite as its database engine with the `better-sqlite3` library for Node.js. The database is designed to support multi-user personal finance tracking with accounts, transactions, budgets, goals, and more.

## Database Configuration

- **Engine:** SQLite 3
- **Library:** better-sqlite3
- **File:** `backend/fintrackr.db`
- **Journal Mode:** WAL (Write-Ahead Logging) for better concurrency
- **Foreign Keys:** ENABLED

## Tables

### 1. users

Stores user account information.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_users_email` on `email` (for login lookups)

**Relationships:**
- One-to-many with: accounts, categories, transactions, budgets, goals, planned, subscriptions, rules, etc.

---

### 2. accounts

User's financial accounts (bank accounts, wallets, etc.).

```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  balance REAL NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_accounts_user_id` on `user_id`

**Supported Currencies:** USD, EUR, PLN, RUB

---

### 3. categories

Transaction categories for organizing income and expenses.

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_categories_user_id` on `user_id`

---

### 4. transactions

Financial transactions (income and expenses).

```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  category_id INTEGER,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  date DATE NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

**Indexes:**
- `idx_transactions_user_id` on `user_id`
- `idx_transactions_user_date` on `(user_id, date DESC)` - optimizes date-based queries
- `idx_transactions_account` on `account_id`
- `idx_transactions_category` on `category_id`
- `idx_transactions_type` on `type`

**Notes:**
- `category_id` is optional (nullable)
- `date` is stored as DATE (YYYY-MM-DD)
- Account balance is updated automatically when transactions are created/deleted

---

### 5. budgets

Monthly spending limits by category.

```sql
CREATE TABLE budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  limit_amount REAL NOT NULL DEFAULT 0,
  spent REAL NOT NULL DEFAULT 0,
  type TEXT DEFAULT 'fixed',
  percent REAL,
  currency TEXT DEFAULT 'USD',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(user_id, category_id, month)
);
```

**Indexes:**
- `idx_budgets_user_month` on `(user_id, month)`
- `idx_budgets_category` on `category_id`

**Unique Constraint:** One budget per user, category, and month

**Budget Types:**
- `fixed` - Fixed amount limit
- `percentage` - Percentage-based limit

**Month Format:** YYYY-MM (e.g., "2025-01")

---

### 6. goals

Financial savings goals.

```sql
CREATE TABLE goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0,
  deadline DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_goals_user_id` on `user_id`

---

### 7. planned

Planned recurring operations (future income/expenses).

```sql
CREATE TABLE planned (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  category_id INTEGER,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date DATE NOT NULL,
  frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

**Indexes:**
- `idx_planned_user_id` on `user_id`

**Frequency Values:**
- `daily` - Every day
- `weekly` - Every week
- `monthly` - Every month
- `yearly` - Every year

---

### 8. subscriptions

Subscription services tracking.

```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_subscriptions_user_id` on `user_id`
- `idx_subscriptions_next_date` on `next_date` - for upcoming payment notifications

---

### 9. rules

Automatic transaction categorization rules.

```sql
CREATE TABLE rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pattern TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  confidence REAL DEFAULT 1.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_rules_user_id` on `user_id`

**Pattern:** Regex pattern to match transaction descriptions
**Confidence:** 0.0 to 1.0 (0% to 100% confidence)

---

### 10. recurring

Detected recurring transaction patterns.

```sql
CREATE TABLE recurring (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  frequency TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_recurring_user_id` on `user_id`

---

### 11. bank_connections

Connected bank accounts for sync.

```sql
CREATE TABLE bank_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  bank_id INTEGER NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_bank_connections_user_id` on `user_id`

**Status Values:**
- `active` - Connection is active
- `inactive` - Connection is inactive
- `error` - Connection has errors

---

### 12. refresh_tokens

JWT refresh tokens for authentication.

```sql
CREATE TABLE refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_refresh_tokens_token` on `token` (for token validation)
- `idx_refresh_tokens_user_id` on `user_id`
- `idx_refresh_tokens_expires_at` on `expires_at` (for cleanup)

**Note:** `expires_at` is Unix timestamp in milliseconds

---

### 13. token_blacklist

Revoked/blacklisted tokens.

```sql
CREATE TABLE token_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_token_blacklist_token` on `token`

---

### 14. sessions

User session tracking (Phase 4 security enhancement).

```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  refresh_token TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_sessions_user_id` on `user_id`
- `idx_sessions_refresh_token` on `refresh_token`

---

## Entity Relationship Diagram

```
users
  ├── accounts (1:N)
  │   └── transactions (1:N)
  ├── categories (1:N)
  │   ├── transactions (1:N)
  │   ├── budgets (1:N)
  │   ├── rules (1:N)
  │   └── planned (1:N)
  ├── budgets (1:N)
  ├── goals (1:N)
  ├── planned (1:N)
  ├── subscriptions (1:N)
  ├── rules (1:N)
  ├── recurring (1:N)
  ├── bank_connections (1:N)
  ├── refresh_tokens (1:N)
  └── sessions (1:N)
```

## Database Operations

### Initialization

```bash
npm run db:init
```

Creates the database and applies the schema from `backend/database/schema.sql`.

### Seeding Demo Data

```bash
npm run db:seed
```

Populates the database with demo data for testing. Creates:
- 1 demo user (email: `demo@fintrackr.com`, password: `demo123`)
- 4 accounts with different currencies
- 15 categories (4 income, 11 expense)
- ~200+ transactions over the past 3 months
- 7 budgets for current month
- 4 financial goals
- 5 subscriptions
- 3 planned operations
- 6 categorization rules

### Migrations

Currently using direct SQL schema application. For future versions, consider implementing proper migrations using a tool like:
- node-pg-migrate (adapted for SQLite)
- Knex.js
- Custom migration system

## Performance Considerations

### Indexes

The schema includes strategic indexes on:
- Foreign keys (for joins)
- Frequently queried columns (user_id, date, type)
- Unique constraints (email, token)

### Query Optimization

1. **Transactions by date range:** Use `idx_transactions_user_date`
   ```sql
   SELECT * FROM transactions 
   WHERE user_id = ? AND date >= ? AND date <= ?
   ORDER BY date DESC;
   ```

2. **Budget calculations:** Use `idx_budgets_user_month`
   ```sql
   SELECT * FROM budgets 
   WHERE user_id = ? AND month = ?;
   ```

3. **Category spending:** Use `idx_transactions_category`
   ```sql
   SELECT category_id, SUM(amount) as total
   FROM transactions
   WHERE user_id = ? AND type = 'expense'
   GROUP BY category_id;
   ```

### WAL Mode

The database uses Write-Ahead Logging (WAL) mode for:
- Better concurrent read/write performance
- Reduced blocking
- Crash recovery

## Data Integrity

### Foreign Key Constraints

All relationships enforce referential integrity:
- `ON DELETE CASCADE` - Child records deleted when parent is deleted
- `ON DELETE SET NULL` - Foreign key set to NULL when parent is deleted

### Check Constraints

Enum-like constraints ensure data validity:
- `type IN ('income', 'expense')`
- `frequency IN ('daily', 'weekly', 'monthly', 'yearly')`

### Unique Constraints

Prevent duplicates:
- User email addresses
- User + category + month budgets
- Tokens

## Backup and Maintenance

### Backup

SQLite database can be backed up by simply copying the file:

```bash
cp backend/fintrackr.db backend/fintrackr.db.backup
```

Or use SQLite's backup command:

```bash
sqlite3 backend/fintrackr.db ".backup backup/fintrackr.db.backup"
```

### Cleanup

Periodically clean up old data:

1. **Expired refresh tokens:**
   ```sql
   DELETE FROM refresh_tokens WHERE expires_at < ?;
   ```

2. **Old blacklisted tokens (older than 7 days):**
   ```sql
   DELETE FROM token_blacklist 
   WHERE blacklisted_at < datetime('now', '-7 days');
   ```

3. **Inactive sessions:**
   ```sql
   DELETE FROM sessions 
   WHERE last_activity < datetime('now', '-30 days');
   ```

### Vacuum

Reclaim unused space:

```bash
sqlite3 backend/fintrackr.db "VACUUM;"
```

## Security Considerations

1. **Password Storage:** Passwords are hashed using bcrypt with salt rounds
2. **Token Security:** JWT tokens with expiration, refresh token rotation
3. **SQL Injection:** Prevented by using parameterized queries
4. **Access Control:** User isolation through user_id checks in queries
5. **Foreign Keys:** Enabled to maintain data integrity

## Migration from JSON

The `init.js` script includes functionality to migrate from the old JSON-based storage to SQLite:

```bash
npm run db:migrate
```

This will:
1. Create the database schema
2. Read `data.json`
3. Import all data into SQLite
4. Create a backup of the original JSON file

## Future Enhancements

Potential schema improvements:

1. **Currency table:** Normalize currencies into a separate table
2. **Account types:** Add account_type (checking, savings, credit, etc.)
3. **Tags:** Many-to-many tags for transactions
4. **Attachments:** Store receipt/document references
5. **Notifications:** Table for user notifications
6. **Audit log:** Track all data modifications
7. **Multi-currency support:** Better handling of multiple currencies
8. **Soft deletes:** Add `deleted_at` column for soft delete functionality
