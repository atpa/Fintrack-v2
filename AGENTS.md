# FinTrackr Coding Agents Guide (Codex)

Last updated: 2025-11-18

This document defines how automated coding agents ("Codex agents") work in this repository. It describes roles, guardrails, workflows, and ready-to-use prompt templates. Use it to run safe, consistent, and high-quality automation.

## 1) Scope & Goals
- Accelerate implementation of tracked work from `docs/ISSUES.md`.
- Keep changes minimal, focused, and reversible.
- Maintain code quality, security, and accessibility.
- Produce verifiable outcomes (tests, build, manual acceptance steps).

## 2) Agent Roles
- Refactor Agent: Safe code cleanup, modularization, dead code removal.
- Frontend Agent: UI polish, accessibility (a11y), responsive behavior.
- Backend Agent: Routes/services fixes, error handling, validation.
- Test Agent: Unit/integration/E2E coverage and harness improvements.
- Docs Agent: README, API docs, and change logs.
- Release Agent: Build, verify, and update deployment notes.

## 3) Guardrails (Non‑Negotiable)
- Secrets: Never hardcode or print secrets; require `.env` variables (see `SECURITY.md`).
- Safety: No destructive DB operations without explicit migrations/backup steps.
- Minimalism: Change only what’s necessary; avoid unrelated edits.
- Reversibility: Commit in small logical units; ensure easy rollback.
- Privacy: Do not include real personal data in tests or seeds.
- Licensing: Do not paste copyrighted code you do not own.

## 4) Project Conventions
- Stack: Node.js/Express + SQLite, Vanilla JS frontend.
- Package scripts:
  ```pwsh
  npm run lint
  npm test
  npm start
  ```
- Tests: Jest (backend), Playwright (E2E) — see `jest.config.js`, `playwright.config.js`.
- Structure: Respect the current layout under `backend/`, `public/`, and `docs/`.
- Style: Prefer existing patterns; keep naming consistent; avoid one-letter vars.

## 5) Standard Workflow
1) Traceability: Link work to entries in `docs/ISSUES.md`.
2) Plan: Outline a short plan (bullets) and expected artifacts.
3) Implement: Small, focused patches; update docs if behavior changes.
4) Verify: Run unit tests; add/adjust tests close to the change.
5) Validate UI: Manually check key flows; confirm no console errors.
6) Document: Update `docs/ISSUES.md` status where relevant.
7) Commit: Conventional message (see below) and open PR with summary.

## 6) Commit & PR Conventions
- Branch: `feat/<area>-<short>`, `fix/<area>-<short>`, `refactor/<area>-<short>`.
- Commit message:
  - `feat(frontend): responsive tables for categories/accounts`
  - `fix(api): normalize error payloads`
  - `docs(issues): mark #17 resolved`
- PR description: Problem, approach, scope, testing, risks, screenshots (if UI).

## 7) Testing Matrix
- Unit: Services, utils, middlewares (Jest).
- Integration: Route→service→db happy-path and failures.
- E2E: Core flows (auth, categories, accounts, transactions) via Playwright.
- Accessibility: Semantics and keyboard navigation sanity checks.

## 8) Security & Validation
- Input validation on all write endpoints.
- Standardized errors (status codes + normalized bodies).
- CSRF, CORS, Session/JWT hardening per `backend/middleware/*` and `SECURITY.md`.

## 9) Accessibility (a11y)
- Use semantic landmarks: `header`, `nav`, `main`, `section`, `article`, `footer`.
- Provide labels (`aria-label`, `aria-labelledby`) and roles only when needed.
- Ensure focus states, keyboard nav, and color contrast.

## 10) Performance
- Avoid gratuitous reflows; batch DOM updates.
- Use lazy rendering for large lists; paginate.
- Cache API data where safe; consider TTL for currency service.

## 11) Rollback Plan
- Keep patches small; one concern per commit/PR.
- If regressions appear, revert the offending commit or toggle the feature.

## 12) Ready Prompt Templates

### A) Fix from ISSUES.md
Use when addressing a specific issue.
```
Task: Fix issue <#ID>: <title>.
Constraints: Minimal change, keep style; update docs/tests.
Deliverables: Code patch, updated tests, ISSUES.md status change, brief summary.
Validation: `npm test`, manual page check (URL), console errors = none.
```

### B) Frontend a11y/Responsive Pass
```
Task: Improve accessibility/responsiveness on <page>. 
Add semantic landmarks, ARIA where needed, mobile-first table styles.
Do not change behavior; keep HTML structure intact.
Deliverables: HTML/CSS patches, screenshots, manual checklist results.
```

### C) Backend Error Handling Standardization
```
Task: Normalize errors for <endpoints>.
Add consistent status codes and error shapes, update middleware.
Deliverables: Middleware update, tests, docs notes.
```

### D) Test Hardening
```
Task: Increase coverage for <module>.
Add missing unit/integration tests; avoid flaky timing.
Deliverables: Tests, passing CI, coverage delta.
```

## 13) Manual Acceptance Checklist
- Builds and serves: `npm start` reachable.
- No console errors on target pages.
- Key flows: list/create/update/delete work.
- Loading/empty/error states render.
- a11y landmarks/labels present where appropriate.
- Tests pass locally: `npm test`.

## 14) Known Priorities (Live)
See `docs/ISSUES.md` for the authoritative, prioritized backlog. Keep it updated after each agent run.

## 15) Local Runbook
```pwsh
# Install
npm install

# Lint & test
npm run lint
npm test

# Run server
npm start
```

## 16) Do/Don't Summary
- Do: Small PRs, verify changes, update docs, write tests.
- Don’t: Mix unrelated refactors; introduce dependencies without need; weaken security.

---
Maintainers may adjust this guide as the repository evolves. Keep agents aligned with these principles for safe, high‑quality automation.
