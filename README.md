# FinTrackr

FinTrackr is a Node.js + vanilla JavaScript web app for personal finance management. The project pairs a small Express API with a static frontend bundle served from `/public`, and ships with SQLite-backed persistence plus utilities for currency conversion, analytics, and rule-based categorization.

## Architecture overview
- **API (Express)** – `backend/app.js` wires routers in `backend/routes/` and shared middleware (logging, JSON parsing, centralized error handling). Domain routers include `accounts`, `categories`, `transactions`, `budgets`, `goals`, `subscriptions`, `rules`, `analytics`, `currency`, `meta`, and `sync` plus auth endpoints exposed under `/api/*`.
- **Auth & middleware** – JWT cookies handled by `backend/services/authService.js` and enforced via `backend/middleware/auth.js`; errors are normalized through `backend/middleware/errorHandler.js` with helpers for validation and consistent payloads.
- **Data layer** – Lightweight persistence powered by better-sqlite3 helpers in `backend/services/dataService.js` with schema and init scripts in `backend/database/`.
- **Frontend** – Static HTML/CSS/JS in `/public` and modular browser code in `/frontend` consuming the same `/api` routes; requests follow the middleware conventions (auth cookies + JSON responses).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a deeper component map and migration notes.

## Getting started
1. **Requirements**: Node.js 18+ and npm.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Generate a strong secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
4. **Database**:
   ```bash
   npm run db:init   # create SQLite schema
   npm run db:seed   # optional demo data
   ```
5. **Run the app**:
   ```bash
   npm start
   ```
   The dev server listens on `http://localhost:${PORT||3000}` and serves both API routes and static assets.

## Environment variables
- `JWT_SECRET` – required; signing key for access tokens.
- `PORT` – server port (default `3000`).
- `COOKIE_SECURE` – set `true` for HTTPS-only cookies in production.
- `COOKIE_SAMESITE` – cookie SameSite policy (`Lax` by default, `Strict` recommended for production).
- `FINTRACKR_DISABLE_PERSIST` – set `true` to run the API in ephemeral, in-memory mode.

## Scripts & tests
- `npm start` – launch the Express server.
- `npm run lint` – lint with ESLint.
- `npm test` – Jest suite (backend).
- `npm run test:e2e` – Playwright end-to-end tests.
- `npm run db:init` / `npm run db:seed` – manage the SQLite demo database.

## Deployment
- Production quickstart: set `NODE_ENV=production`, provide a strong `JWT_SECRET`, and enable `COOKIE_SECURE=true` behind HTTPS.
- Common platform settings (Railway/Render/Heroku): install with `npm install`, start with `npm start`, expose the configured `PORT`.
- For detailed steps and runtime topology, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Documentation
- API reference: [`docs/API.md`](docs/API.md)
- Architecture notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Database schema: [`docs/DATABASE.md`](docs/DATABASE.md)

---
MIT License. See [LICENSE](LICENSE) for details.
