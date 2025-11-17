const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateRequest: (req, _res, next) => {
    req.user = { userId: 1, email: 'user@example.com' };
    next();
  },
  optionalAuth: (_req, _res, next) => next()
}));

const accountsRouter = require('../routes/accounts');
const categoriesRouter = require('../routes/categories');
const transactionsRouter = require('../routes/transactions');
const authRouter = require('../routes/auth');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/accounts', accountsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api', authRouter);
  return app;
}

describe('Request validation', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  test('register rejects missing email and password', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ name: 'Test User' });

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'password' })
      ])
    );
  });

  test('login rejects invalid email format', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'not-an-email', password: 'secret' });

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'email' })])
    );
  });

  test('accounts creation validates required fields and types', async () => {
    const response = await request(app)
      .post('/api/accounts')
      .send({ currency: 'USD', balance: 'not-a-number' });

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
        expect.objectContaining({ field: 'balance' })
      ])
    );
  });

  test('categories creation rejects invalid kind', async () => {
    const response = await request(app)
      .post('/api/categories')
      .send({ name: 'Health', kind: 'other' });

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'kind' })])
    );
  });

  test('transactions creation enforces payload shape', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .send({
        account_id: 'abc',
        type: 'expense',
        amount: -5,
        currency: 'US',
        date: 'invalid-date'
      });

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'account_id' }),
        expect.objectContaining({ field: 'amount' }),
        expect.objectContaining({ field: 'currency' }),
        expect.objectContaining({ field: 'date' })
      ])
    );
  });

  test('transactions deletion rejects non-numeric id', async () => {
    const response = await request(app).delete('/api/transactions/not-a-number');

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'id' })])
    );
  });
});
