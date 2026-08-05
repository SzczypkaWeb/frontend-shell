// Shared fixture constants for the e2e auth flow test (e2e/auth.spec.ts).
// Overridable via env vars so a different machine/CI run can point at a
// different database or use different credentials without editing this file.

/** Email/password of the fixture user seeded by global-setup.ts. */
export const TEST_USER_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test-user@example.com';
export const TEST_USER_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'E2eTestPassword123!';

// Postgres connection used to seed/clean up the fixture user directly (see
// global-setup.ts / global-teardown.ts) - the backend has no public register
// endpoint (see backend/src/auth/auth.controller.ts: only POST /auth/login is
// exposed), so a real row has to exist before these tests can log in.
//
// Defaults to the same local database backend/.env.example documents
// (DB_USER=dev, DB_PASSWORD=dev_password, DB_NAME=projekt via
// backend/docker-compose.yml). Some local backend/.env files point at a
// different (e.g. hosted) database instead - set E2E_DATABASE_URL to match
// whatever DATABASE_URL your running backend actually uses.
export const DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgresql://dev:dev_password@localhost:5432/projekt';

// Backend base URL. Mirrors src/api/config.ts's default so the assertion
// about the Google OAuth button's href stays correct even if API_URL is
// overridden when starting the dev server.
export const API_BASE_URL = process.env.API_URL ?? 'http://localhost:3000';
