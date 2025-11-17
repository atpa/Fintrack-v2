# FinTrackr REST API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Or use the `auth` cookie (automatically set on login).

## Response Format

### Success Response
```json
{
  "id": 1,
  "name": "Example",
  ...
}
```

### Error Response
```json
{
  "message": "Human friendly description",
  "code": "ERROR_CODE",
  "details": [
    { "field": "name", "message": "Name is required" }
  ]
}
```

## HTTP Status Codes

- `200 OK` - Successful GET, PUT
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Validation error or missing required fields (`VALIDATION_ERROR`)
- `401 Unauthorized` - Missing or invalid authentication (`AUTHENTICATION_ERROR`)
- `403 Forbidden` - Authenticated but not authorized for this resource (`FORBIDDEN`)
- `404 Not Found` - Resource not found (`NOT_FOUND`)
- `500 Internal Server Error` - Server error (`INTERNAL_ERROR`)

---

## Authentication Endpoints

### Register New User

**POST** `/api/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Errors:**
- `400` - Email already exists
- `400` - Validation errors

---

### Login

**POST** `/api/login`

Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

Sets `auth` and `refresh` cookies.

**Errors:**
- `401` - Invalid credentials

---

### Refresh Token

**POST** `/api/refresh`

Get a new access token using refresh token.

**Request:** No body required (uses refresh cookie)

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### Logout

**POST** `/api/logout`

Invalidate current session.

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

## Accounts

### Get All Accounts

**GET** `/api/accounts`

Get all accounts for authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Main Account",
    "currency": "USD",
    "balance": 1500.50,
    "created_at": "2025-01-15T10:00:00.000Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "name": "Savings",
    "currency": "EUR",
    "balance": 3000.00,
    "created_at": "2025-01-16T14:30:00.000Z"
  }
]
```

---

### Get Account by ID

**GET** `/api/accounts/:id`

Get specific account details.

**Response:** `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Main Account",
  "currency": "USD",
  "balance": 1500.50,
  "created_at": "2025-01-15T10:00:00.000Z"
}
```

**Errors:**
- `404` - Account not found
- `403` - Not authorized to access this account

---

### Create Account

**POST** `/api/accounts`

Create a new account.

**Request Body:**
```json
{
  "name": "Savings Account",
  "currency": "USD",
  "balance": 1000.00
}
```

**Response:** `201 Created`
```json
{
  "id": 3,
  "user_id": 1,
  "name": "Savings Account",
  "currency": "USD",
  "balance": 1000.00,
  "created_at": "2025-01-20T09:15:00.000Z"
}
```

**Errors:**
- `400` - Name and currency are required

---

### Update Account

**PUT** `/api/accounts/:id`

Update account details.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "currency": "EUR",
  "balance": 2000.00
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Updated Name",
  "currency": "EUR",
  "balance": 2000.00,
  "created_at": "2025-01-15T10:00:00.000Z"
}
```

**Errors:**
- `404` - Account not found
- `403` - Not authorized

---

### Delete Account

**DELETE** `/api/accounts/:id`

Delete an account.

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Errors:**
- `404` - Account not found
- `403` - Not authorized

---

## Categories

### Get All Categories

**GET** `/api/categories`

Get all categories for authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Salary",
    "kind": "income",
    "created_at": "2025-01-15T10:00:00.000Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "name": "Groceries",
    "kind": "expense",
    "created_at": "2025-01-15T10:05:00.000Z"
  }
]
```

---

### Create Category

**POST** `/api/categories`

Create a new category.

**Request Body:**
```json
{
  "name": "Transportation",
  "kind": "expense"
}
```

`kind` must be either `"income"` or `"expense"`.

**Response:** `201 Created`
```json
{
  "id": 5,
  "user_id": 1,
  "name": "Transportation",
  "kind": "expense",
  "created_at": "2025-01-20T10:00:00.000Z"
}
```

**Errors:**
- `400` - Name and kind are required
- `400` - Kind must be income or expense

---

### Update Category

**PUT** `/api/categories/:id`

Update category details.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "kind": "income"
}
```

**Response:** `200 OK`

**Errors:**
- `404` - Category not found
- `403` - Not authorized
- `400` - Invalid kind

---

### Delete Category

**DELETE** `/api/categories/:id`

Delete a category.

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Errors:**
- `404` - Category not found
- `403` - Not authorized

---

## Transactions

### Get All Transactions

**GET** `/api/transactions`

Get all transactions for authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "account_id": 1,
    "category_id": 2,
    "type": "expense",
    "amount": 45.50,
    "currency": "USD",
    "date": "2025-01-18",
    "note": "Weekly groceries",
    "created_at": "2025-01-18T14:30:00.000Z"
  }
]
```

---

### Create Transaction

**POST** `/api/transactions`

Create a new transaction. Automatically updates account balance and budgets.

**Request Body:**
```json
{
  "account_id": 1,
  "category_id": 2,
  "type": "expense",
  "amount": 45.50,
  "currency": "USD",
  "date": "2025-01-18",
  "note": "Weekly groceries"
}
```

**Required fields:** `account_id`, `type`, `amount`, `currency`, `date`

**Response:** `201 Created`
```json
{
  "id": 10,
  "user_id": 1,
  "account_id": 1,
  "category_id": 2,
  "type": "expense",
  "amount": 45.50,
  "currency": "USD",
  "date": "2025-01-18",
  "note": "Weekly groceries",
  "created_at": "2025-01-18T14:30:00.000Z"
}
```

**Side Effects:**
- Updates account balance (converts currency if needed)
- Updates or creates budget for the category and month

**Errors:**
- `400` - Missing required fields
- `400` - Type must be income or expense
- `403` - Invalid account

---

### Delete Transaction

**DELETE** `/api/transactions/:id`

Delete a transaction. Automatically reverts account balance and budget changes.

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Side Effects:**
- Reverts account balance changes
- Reverts budget spent amount

**Errors:**
- `404` - Transaction not found
- `403` - Not authorized

---

## Budgets

### Get All Budgets

**GET** `/api/budgets`

Get all budgets for authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "category_id": 2,
    "month": "2025-01",
    "limit_amount": 500.00,
    "spent": 245.30,
    "type": "fixed",
    "percent": null,
    "currency": "USD",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### Create Budget

**POST** `/api/budgets`

Create a new budget for a category and month.

**Request Body:**
```json
{
  "category_id": 2,
  "month": "2025-01",
  "limit_amount": 500.00,
  "type": "fixed",
  "currency": "USD"
}
```

**Required fields:** `category_id`, `month`

**Response:** `201 Created`

**Errors:**
- `400` - Category and month are required

---

### Update Budget

**PUT** `/api/budgets/:id`

Update budget details.

**Request Body:** (all fields optional)
```json
{
  "limit_amount": 600.00,
  "spent": 250.00
}
```

**Response:** `200 OK`

**Errors:**
- `404` - Budget not found

---

### Delete Budget

**DELETE** `/api/budgets/:id`

Delete a budget.

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Errors:**
- `404` - Budget not found

---

## Goals

### Get All Goals

**GET** `/api/goals`

Get all financial goals for authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Emergency Fund",
    "target_amount": 10000.00,
    "current_amount": 3500.00,
    "deadline": "2025-12-31",
    "created_at": "2025-01-10T12:00:00.000Z"
  }
]
```

---

### Create Goal

**POST** `/api/goals`

Create a new financial goal.

**Request Body:**
```json
{
  "title": "Vacation Fund",
  "target_amount": 5000.00,
  "current_amount": 0,
  "deadline": "2025-08-31"
}
```

**Required fields:** `title`, `target_amount`

**Response:** `201 Created`

**Errors:**
- `400` - Title and target amount are required

---

### Update Goal

**PUT** `/api/goals/:id`

Update goal details.

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "current_amount": 4000.00
}
```

**Response:** `200 OK`

**Errors:**
- `404` - Goal not found

---

### Delete Goal

**DELETE** `/api/goals/:id`

Delete a goal.

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Errors:**
- `404` - Goal not found

---

## Analytics

### Get Dashboard Summary

**GET** `/api/analytics/summary`

Get financial summary for authenticated user.

**Response:** `200 OK`
```json
{
  "totalBalance": 15000.50,
  "monthlyIncome": 5000.00,
  "monthlyExpenses": 3200.00,
  "accountsCount": 3,
  "transactionsCount": 45
}
```

---

### Get Spending by Category

**GET** `/api/analytics/spending-by-category`

Get expense breakdown by category.

**Query Parameters:**
- `month` (optional) - Format: "YYYY-MM"

**Response:** `200 OK`
```json
[
  {
    "category": "Groceries",
    "amount": 450.30,
    "percentage": 35
  },
  {
    "category": "Transportation",
    "amount": 250.00,
    "percentage": 19
  }
]
```

---

## Currency

### Get Exchange Rate

**GET** `/api/rates`

Get current exchange rate between two currencies.

**Query Parameters:**
- `base` (required) - Base currency code (e.g., "USD")
- `quote` (required) - Quote currency code (e.g., "EUR")

**Response:** `200 OK`
```json
{
  "base": "USD",
  "quote": "EUR",
  "rate": 0.92,
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

---

## Meta

### Get Banks

**GET** `/api/banks`

Get list of supported banks for sync.

**Response:** `200 OK`
```json
[
  { "id": 1, "name": "Тинькофф" },
  { "id": 2, "name": "Сбербанк" },
  { "id": 3, "name": "Альфа-Банк" },
  { "id": 4, "name": "ВТБ" }
]
```

---

## Common Error Scenarios

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Notes

1. **Currency Conversion**: When creating transactions, the system automatically converts amounts to the account's currency using current exchange rates.

2. **Budget Auto-Creation**: When creating an expense transaction with a category, if no budget exists for that category and month, one is automatically created with the spent amount.

3. **Balance Updates**: Creating or deleting transactions automatically updates the associated account balance.

4. **Date Format**: All dates should be in ISO 8601 format (YYYY-MM-DD or full datetime).

5. **Supported Currencies**: USD, EUR, PLN, RUB

6. **Token Expiration**: 
   - Access tokens expire after 15 minutes
   - Refresh tokens expire after 7 days
   - Use `/api/refresh` to get new access tokens

## Rate Limiting

Currently not implemented. Consider implementing rate limiting for production use.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.
