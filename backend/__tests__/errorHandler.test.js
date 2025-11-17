const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => ({
  authenticateRequest: (req, res, next) => {
    req.user = { userId: 1, email: 'user@example.com' };
    next();
  }
}));

jest.mock('../services/dataService', () => {
  let accounts = [
    { id: 1, user_id: 1, name: 'Main', currency: 'USD', balance: 100 },
    { id: 2, user_id: 2, name: 'Other', currency: 'USD', balance: 50 },
  ];
  let nextId = 3;

  return {
    __esModule: true,
    resetAccounts: () => {
      accounts = [
        { id: 1, user_id: 1, name: 'Main', currency: 'USD', balance: 100 },
        { id: 2, user_id: 2, name: 'Other', currency: 'USD', balance: 50 },
      ];
      nextId = 3;
    },
    getAccountsByUserId: jest.fn((userId) => accounts.filter((acc) => acc.user_id === userId)),
    getAccountById: jest.fn((id) => accounts.find((acc) => acc.id === Number(id))),
    createAccount: jest.fn((userId, name, currency, balance = 0) => {
      const account = { id: nextId++, user_id: userId, name, currency, balance };
      accounts.push(account);
      return account.id;
    }),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
  };
});

const accountsRouter = require('../routes/accounts');
const { errorHandler } = require('../middleware/errorHandler');
const dataService = require('../services/dataService');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/accounts', accountsRouter);
  app.use(errorHandler);
  return app;
}

describe('errorHandler middleware', () => {
  let app;

  beforeEach(() => {
    dataService.resetAccounts();
    app = buildApp();
  });

  test('returns normalized validation error payload', async () => {
    const response = await request(app).post('/api/accounts').send({ currency: 'USD' }).expect(400);

    expect(response.body).toEqual({
      message: 'Name and currency are required',
      code: 'VALIDATION_ERROR',
      details: [
        { field: 'name', message: 'Name is required' },
        { field: 'currency', message: 'Currency is required' },
      ],
    });
  });

  test('returns normalized not found payload', async () => {
    const response = await request(app).get('/api/accounts/999').expect(404);

    expect(response.body).toEqual({
      message: 'Account not found',
      code: 'NOT_FOUND',
    });
  });

  test('returns normalized authorization payload', async () => {
    const response = await request(app).get('/api/accounts/2').expect(403);

    expect(response.body).toEqual({
      message: 'Access denied',
      code: 'FORBIDDEN',
    });
  });
});
