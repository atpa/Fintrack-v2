/**
 * Database seed script
 * Populates the database with demo data for testing and demonstration
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'fintrackr.db');

/**
 * Create demo user account
 */
function createDemoUser(db) {
  const passwordHash = bcrypt.hashSync('demo123', 10);
  
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `);
  
  const result = insertUser.run('Demo User', 'demo@fintrackr.com', passwordHash);
  console.log(`✅ Created demo user (ID: ${result.lastInsertRowid})`);
  
  return result.lastInsertRowid;
}

/**
 * Create demo accounts
 */
function createDemoAccounts(db, userId) {
  const accounts = [
    { name: 'Main Account', currency: 'USD', balance: 5420.50 },
    { name: 'Savings', currency: 'USD', balance: 15000.00 },
    { name: 'EUR Account', currency: 'EUR', balance: 3200.00 },
    { name: 'Cash Wallet', currency: 'RUB', balance: 8500.00 }
  ];
  
  const insertAccount = db.prepare(`
    INSERT INTO accounts (user_id, name, currency, balance)
    VALUES (?, ?, ?, ?)
  `);
  
  const accountIds = [];
  for (const account of accounts) {
    const result = insertAccount.run(userId, account.name, account.currency, account.balance);
    accountIds.push(result.lastInsertRowid);
  }
  
  console.log(`✅ Created ${accounts.length} demo accounts`);
  return accountIds;
}

/**
 * Create demo categories
 */
function createDemoCategories(db, userId) {
  const categories = [
    // Income categories
    { name: 'Salary', kind: 'income' },
    { name: 'Freelance', kind: 'income' },
    { name: 'Investments', kind: 'income' },
    { name: 'Other Income', kind: 'income' },
    
    // Expense categories
    { name: 'Groceries', kind: 'expense' },
    { name: 'Transportation', kind: 'expense' },
    { name: 'Utilities', kind: 'expense' },
    { name: 'Entertainment', kind: 'expense' },
    { name: 'Healthcare', kind: 'expense' },
    { name: 'Shopping', kind: 'expense' },
    { name: 'Dining Out', kind: 'expense' },
    { name: 'Education', kind: 'expense' },
    { name: 'Housing', kind: 'expense' },
    { name: 'Insurance', kind: 'expense' },
    { name: 'Other Expenses', kind: 'expense' }
  ];
  
  const insertCategory = db.prepare(`
    INSERT INTO categories (user_id, name, kind)
    VALUES (?, ?, ?)
  `);
  
  const categoryIds = { income: [], expense: [] };
  for (const category of categories) {
    const result = insertCategory.run(userId, category.name, category.kind);
    categoryIds[category.kind].push({
      id: result.lastInsertRowid,
      name: category.name
    });
  }
  
  console.log(`✅ Created ${categories.length} demo categories`);
  return categoryIds;
}

/**
 * Create demo transactions for the past 3 months
 */
function createDemoTransactions(db, userId, accountIds, categoryIds) {
  const insertTransaction = db.prepare(`
    INSERT INTO transactions (user_id, account_id, category_id, type, amount, currency, date, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transactions = [];
  const today = new Date();
  const months = 3;
  
  // Helper to get random date in past N months
  const getRandomDate = (monthsAgo) => {
    const date = new Date(today);
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate(Math.floor(Math.random() * 28) + 1);
    return date.toISOString().split('T')[0];
  };
  
  // Helper to get random item from array
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  // Create transactions for each month
  for (let month = 0; month < months; month++) {
    // Monthly salary (income)
    transactions.push({
      account_id: accountIds[0],
      category_id: categoryIds.income.find(c => c.name === 'Salary').id,
      type: 'income',
      amount: 5000 + Math.random() * 1000,
      currency: 'USD',
      date: getRandomDate(month),
      note: 'Monthly salary'
    });
    
    // Freelance income (occasional)
    if (Math.random() > 0.5) {
      transactions.push({
        account_id: accountIds[0],
        category_id: categoryIds.income.find(c => c.name === 'Freelance').id,
        type: 'income',
        amount: 500 + Math.random() * 1500,
        currency: 'USD',
        date: getRandomDate(month),
        note: 'Freelance project'
      });
    }
    
    // Groceries (weekly, 4-5 times per month)
    const groceriesCount = 4 + Math.floor(Math.random() * 2);
    const groceriesCategory = categoryIds.expense.find(c => c.name === 'Groceries').id;
    for (let i = 0; i < groceriesCount; i++) {
      transactions.push({
        account_id: getRandom(accountIds),
        category_id: groceriesCategory,
        type: 'expense',
        amount: 50 + Math.random() * 100,
        currency: 'USD',
        date: getRandomDate(month),
        note: `Groceries shopping ${i + 1}`
      });
    }
    
    // Transportation (10-15 times per month)
    const transportCount = 10 + Math.floor(Math.random() * 6);
    const transportCategory = categoryIds.expense.find(c => c.name === 'Transportation').id;
    for (let i = 0; i < transportCount; i++) {
      transactions.push({
        account_id: getRandom(accountIds),
        category_id: transportCategory,
        type: 'expense',
        amount: 5 + Math.random() * 30,
        currency: 'USD',
        date: getRandomDate(month),
        note: Math.random() > 0.5 ? 'Taxi' : 'Public transport'
      });
    }
    
    // Utilities (monthly)
    transactions.push({
      account_id: accountIds[0],
      category_id: categoryIds.expense.find(c => c.name === 'Utilities').id,
      type: 'expense',
      amount: 120 + Math.random() * 50,
      currency: 'USD',
      date: getRandomDate(month),
      note: 'Monthly utilities bill'
    });
    
    // Housing (monthly rent/mortgage)
    transactions.push({
      account_id: accountIds[0],
      category_id: categoryIds.expense.find(c => c.name === 'Housing').id,
      type: 'expense',
      amount: 1200 + Math.random() * 300,
      currency: 'USD',
      date: getRandomDate(month),
      note: 'Monthly rent'
    });
    
    // Dining out (5-8 times per month)
    const diningCount = 5 + Math.floor(Math.random() * 4);
    const diningCategory = categoryIds.expense.find(c => c.name === 'Dining Out').id;
    for (let i = 0; i < diningCount; i++) {
      transactions.push({
        account_id: getRandom(accountIds),
        category_id: diningCategory,
        type: 'expense',
        amount: 15 + Math.random() * 50,
        currency: 'USD',
        date: getRandomDate(month),
        note: Math.random() > 0.7 ? 'Restaurant' : 'Cafe'
      });
    }
    
    // Entertainment (3-5 times per month)
    const entertainmentCount = 3 + Math.floor(Math.random() * 3);
    const entertainmentCategory = categoryIds.expense.find(c => c.name === 'Entertainment').id;
    for (let i = 0; i < entertainmentCount; i++) {
      transactions.push({
        account_id: getRandom(accountIds),
        category_id: entertainmentCategory,
        type: 'expense',
        amount: 20 + Math.random() * 80,
        currency: 'USD',
        date: getRandomDate(month),
        note: ['Cinema', 'Concert', 'Theater', 'Streaming subscription'][Math.floor(Math.random() * 4)]
      });
    }
    
    // Shopping (2-4 times per month)
    const shoppingCount = 2 + Math.floor(Math.random() * 3);
    const shoppingCategory = categoryIds.expense.find(c => c.name === 'Shopping').id;
    for (let i = 0; i < shoppingCount; i++) {
      transactions.push({
        account_id: getRandom(accountIds),
        category_id: shoppingCategory,
        type: 'expense',
        amount: 30 + Math.random() * 200,
        currency: 'USD',
        date: getRandomDate(month),
        note: ['Clothes', 'Electronics', 'Books', 'Home goods'][Math.floor(Math.random() * 4)]
      });
    }
    
    // Healthcare (occasional)
    if (Math.random() > 0.6) {
      transactions.push({
        account_id: accountIds[0],
        category_id: categoryIds.expense.find(c => c.name === 'Healthcare').id,
        type: 'expense',
        amount: 50 + Math.random() * 150,
        currency: 'USD',
        date: getRandomDate(month),
        note: 'Doctor visit / Pharmacy'
      });
    }
  }
  
  // Insert all transactions
  let count = 0;
  for (const tx of transactions) {
    insertTransaction.run(
      userId,
      tx.account_id,
      tx.category_id,
      tx.type,
      tx.amount,
      tx.currency,
      tx.date,
      tx.note
    );
    count++;
  }
  
  console.log(`✅ Created ${count} demo transactions`);
}

/**
 * Create demo budgets
 */
function createDemoBudgets(db, userId, categoryIds) {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  const budgets = [
    { category: 'Groceries', limit: 600, spent: 0 },
    { category: 'Transportation', limit: 300, spent: 0 },
    { category: 'Utilities', limit: 150, spent: 0 },
    { category: 'Dining Out', limit: 400, spent: 0 },
    { category: 'Entertainment', limit: 300, spent: 0 },
    { category: 'Shopping', limit: 500, spent: 0 },
    { category: 'Healthcare', limit: 200, spent: 0 }
  ];
  
  const insertBudget = db.prepare(`
    INSERT INTO budgets (user_id, category_id, month, limit_amount, spent, type, currency)
    VALUES (?, ?, ?, ?, ?, 'fixed', 'USD')
  `);
  
  for (const budget of budgets) {
    const category = categoryIds.expense.find(c => c.name === budget.category);
    if (category) {
      // Calculate spent from transactions in current month
      const spent = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE user_id = ? AND category_id = ? AND strftime('%Y-%m', date) = ?
      `).get(userId, category.id, currentMonth);
      
      insertBudget.run(
        userId,
        category.id,
        currentMonth,
        budget.limit,
        spent.total
      );
    }
  }
  
  console.log(`✅ Created ${budgets.length} demo budgets for ${currentMonth}`);
}

/**
 * Create demo goals
 */
function createDemoGoals(db, userId) {
  const goals = [
    {
      title: 'Emergency Fund',
      target: 10000,
      current: 5420,
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0]
    },
    {
      title: 'Vacation to Europe',
      target: 5000,
      current: 1200,
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 9)).toISOString().split('T')[0]
    },
    {
      title: 'New Laptop',
      target: 2000,
      current: 850,
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0]
    },
    {
      title: 'Retirement Fund',
      target: 100000,
      current: 15000,
      deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().split('T')[0]
    }
  ];
  
  const insertGoal = db.prepare(`
    INSERT INTO goals (user_id, title, target_amount, current_amount, deadline)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  for (const goal of goals) {
    insertGoal.run(userId, goal.title, goal.target, goal.current, goal.deadline);
  }
  
  console.log(`✅ Created ${goals.length} demo goals`);
}

/**
 * Create demo subscriptions
 */
function createDemoSubscriptions(db, userId) {
  const subscriptions = [
    { title: 'Netflix', amount: 15.99, frequency: 'monthly', daysFromNow: 5 },
    { title: 'Spotify', amount: 9.99, frequency: 'monthly', daysFromNow: 12 },
    { title: 'Amazon Prime', amount: 14.99, frequency: 'monthly', daysFromNow: 18 },
    { title: 'Gym Membership', amount: 49.99, frequency: 'monthly', daysFromNow: 8 },
    { title: 'Cloud Storage', amount: 9.99, frequency: 'monthly', daysFromNow: 22 }
  ];
  
  const insertSubscription = db.prepare(`
    INSERT INTO subscriptions (user_id, title, amount, currency, frequency, next_date)
    VALUES (?, ?, ?, 'USD', ?, ?)
  `);
  
  for (const sub of subscriptions) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + sub.daysFromNow);
    insertSubscription.run(
      userId,
      sub.title,
      sub.amount,
      sub.frequency,
      nextDate.toISOString().split('T')[0]
    );
  }
  
  console.log(`✅ Created ${subscriptions.length} demo subscriptions`);
}

/**
 * Create demo planned operations
 */
function createDemoPlanned(db, userId, accountIds, categoryIds) {
  const planned = [
    {
      account_id: accountIds[0],
      category_id: categoryIds.income.find(c => c.name === 'Salary').id,
      type: 'income',
      amount: 5500,
      currency: 'USD',
      frequency: 'monthly',
      note: 'Monthly salary'
    },
    {
      account_id: accountIds[0],
      category_id: categoryIds.expense.find(c => c.name === 'Housing').id,
      type: 'expense',
      amount: 1300,
      currency: 'USD',
      frequency: 'monthly',
      note: 'Monthly rent'
    },
    {
      account_id: accountIds[0],
      category_id: categoryIds.expense.find(c => c.name === 'Utilities').id,
      type: 'expense',
      amount: 150,
      currency: 'USD',
      frequency: 'monthly',
      note: 'Utilities'
    }
  ];
  
  const insertPlanned = db.prepare(`
    INSERT INTO planned (user_id, account_id, category_id, type, amount, currency, start_date, frequency, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const startDate = new Date();
  startDate.setDate(1); // First day of next month
  startDate.setMonth(startDate.getMonth() + 1);
  const startDateStr = startDate.toISOString().split('T')[0];
  
  for (const plan of planned) {
    insertPlanned.run(
      userId,
      plan.account_id,
      plan.category_id,
      plan.type,
      plan.amount,
      plan.currency,
      startDateStr,
      plan.frequency,
      plan.note
    );
  }
  
  console.log(`✅ Created ${planned.length} demo planned operations`);
}

/**
 * Create demo categorization rules
 */
function createDemoRules(db, userId, categoryIds) {
  const rules = [
    { pattern: 'uber|taxi|lyft', category: 'Transportation', confidence: 0.95 },
    { pattern: 'netflix|spotify|prime', category: 'Entertainment', confidence: 0.98 },
    { pattern: 'walmart|target|grocery', category: 'Groceries', confidence: 0.9 },
    { pattern: 'restaurant|cafe|coffee', category: 'Dining Out', confidence: 0.85 },
    { pattern: 'amazon|ebay|shop', category: 'Shopping', confidence: 0.8 },
    { pattern: 'doctor|pharmacy|hospital', category: 'Healthcare', confidence: 0.95 }
  ];
  
  const insertRule = db.prepare(`
    INSERT INTO rules (user_id, pattern, category_id, confidence)
    VALUES (?, ?, ?, ?)
  `);
  
  for (const rule of rules) {
    const category = categoryIds.expense.find(c => c.name === rule.category);
    if (category) {
      insertRule.run(userId, rule.pattern, category.id, rule.confidence);
    }
  }
  
  console.log(`✅ Created ${rules.length} demo categorization rules`);
}

/**
 * Main seed function
 */
function seedDatabase() {
  console.log('Starting database seed...\n');
  
  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database not found. Please run database initialization first:');
    console.error('   npm run db:init');
    process.exit(1);
  }
  
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  try {
    // Check if demo user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@fintrackr.com');
    
    if (existingUser) {
      console.log('⚠️  Demo data already exists. Skipping seed.');
      console.log('   To reseed, delete the database and run db:init first.');
      db.close();
      return;
    }
    
    // Wrap all operations in a transaction
    const seed = db.transaction(() => {
      const userId = createDemoUser(db);
      const accountIds = createDemoAccounts(db, userId);
      const categoryIds = createDemoCategories(db, userId);
      createDemoTransactions(db, userId, accountIds, categoryIds);
      createDemoBudgets(db, userId, categoryIds);
      createDemoGoals(db, userId);
      createDemoSubscriptions(db, userId);
      createDemoPlanned(db, userId, accountIds, categoryIds);
      createDemoRules(db, userId, categoryIds);
    });
    
    seed();
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nDemo account credentials:');
    console.log('  Email: demo@fintrackr.com');
    console.log('  Password: demo123');
    console.log('\nYou can now start the application and login with these credentials.');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
