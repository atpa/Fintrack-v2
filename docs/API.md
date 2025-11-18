# FinTrackr API

The FinTrackr backend is a cookie-authenticated Express API served from `/api`. Responses are JSON. Authenticated routes require a valid access token stored in the `access_token` cookie (automatically set by the auth endpoints) or provided as a `Bearer` token.

- **Base URL (local)**: `http://localhost:3000/api`
- **Content type**: `application/json`
- **Auth**: JWT cookies (`access_token`, `refresh_token`) issued by `/api/login` or `/api/register`
- **Error shape**: `{ "error": "Message" }` with appropriate HTTP status (400/401/403/404/500)

## Authentication
| Endpoint | Method | Description |
| --- | --- | --- |
| `/register` | POST | Create an account and set auth cookies. |
| `/login` | POST | Authenticate and set `access_token` + `refresh_token` cookies. |
| `/logout` | POST | Clear cookies, blacklist active tokens. |
| `/refresh` | POST | Rotate the access token using the refresh cookie. |
| `/session` | GET | Returns the current user if the access token is valid (auto-refreshes if refresh cookie is valid). |

**Register**
```http
POST /api/register
Content-Type: application/json

{ "name": "Jane", "email": "jane@example.com", "password": "Secret123" }
```
Returns the created user and sets auth cookies.

**Login**
```http
POST /api/login
Content-Type: application/json

{ "email": "jane@example.com", "password": "Secret123" }
```
Returns the sanitized user and sets `access_token` + `refresh_token` cookies.

## Core resources
All resource routes require authentication via cookies (or `Authorization: Bearer <access_token>`). Each route enforces ownership using the `authenticateRequest` middleware.

### Accounts
- `GET /api/accounts` — list accounts for the authenticated user.
- `GET /api/accounts/:id` — fetch a single account (403 if owned by another user).
- `POST /api/accounts` — create an account. Body: `{ name, currency, balance? }`.
- `PUT /api/accounts/:id` — update mutable fields `{ name?, currency?, balance? }`.
- `DELETE /api/accounts/:id` — delete an account.

Example create:
```http
POST /api/accounts
Cookie: access_token=...
Content-Type: application/json

{ "name": "Main", "currency": "USD", "balance": 1200 }
```
Response `201 Created` with the persisted account.

### Categories
- `GET /api/categories`
- `POST /api/categories` - `{ name }`
- `PUT /api/categories/:id` - `{ name? }`
- `DELETE /api/categories/:id`

### Transactions
- `GET /api/transactions`
- `POST /api/transactions` — `{ account_id, category_id?, type: "income"|"expense", amount, currency, date, note? }`
  - Updates account balance using `currencyService.convertAmount` to keep balances consistent.
  - If `type === "expense"` with `category_id`, the month’s budget is auto-created or incremented.
- `DELETE /api/transactions/:id` — reverts balance/budget impacts, then removes the record.

### Budgets
- `GET /api/budgets`
- `POST /api/budgets` — `{ category_id, month, limit_amount?, type?, percent?, currency? }`
- `PUT /api/budgets/:id` — update any of `{ limit_amount, spent, type, percent, currency }`
- `DELETE /api/budgets/:id`

### Goals, planned items, subscriptions, rules
These resources follow the same authenticated CRUD pattern:
- `GET /api/goals` | `POST /api/goals` | `PUT /api/goals/:id` | `DELETE /api/goals/:id`
- `GET /api/planned` | `POST /api/planned` | `PUT /api/planned/:id` | `DELETE /api/planned/:id`
- `GET /api/subscriptions` | `POST /api/subscriptions` | `PUT /api/subscriptions/:id` | `DELETE /api/subscriptions/:id`
- `GET /api/rules` | `POST /api/rules` | `PUT /api/rules/:id` | `DELETE /api/rules/:id`

Each route validates ownership and returns either the JSON entity or `{ "success": true }` on deletion.

### Analytics
Authenticated endpoints currently return placeholder payloads and are safe to stub in clients:
- `GET /api/forecast` → `{ "forecast": [] }`
- `GET /api/recurring` → `{ "recurring": [] }`
- `GET /api/insights` → `{ "insights": [] }`

### Currency & meta
- `GET /api/rates?base=USD&quote=EUR` — returns `{ base, quote, rate }` using the in-memory rate map.
- `GET /api/convert?amount=100&from=USD&to=EUR` — returns `{ from, to, amount, rate, result }`.
- `GET /api/banks` — mock list of supported banks for sync flows.

### Sync
- `POST /api/sync/:bankId/transactions` — fetches mock transactions for a bank and attempts to categorize them. Requires authentication and uses the same auth cookie flow as other routers.

## Error handling and validation
- Authentication failures return `401` with `{ "error": "Authentication required" | "Invalid token" | "Token expired" }` depending on the middleware check.
- Authorization checks on resource ownership return `403` with `{ "error": "Access denied" }`.
- Validation failures return `400` with field-specific messages (e.g., missing required fields or unsupported currency pairs).
- All unhandled errors surface as `500` with `{ "error": "Internal server error" }`.

## Working with the frontend client
The bundled frontend uses the cookie-based flow; when calling the API directly from a browser or HTTP client:
1. Hit `/api/login` (or `/api/register`) to obtain cookies.
2. Subsequent requests automatically include cookies for the same origin. For cross-origin tools, forward the cookies or pass `Authorization: Bearer <access_token>`.
3. Expect JSON payloads only; there is no multipart handling in the current middleware stack.

Refer back to [`README.md`](../README.md) for setup, environment variables, and deployment guidance.
