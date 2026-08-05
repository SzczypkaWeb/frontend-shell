# End-to-end tests (Playwright)

This directory holds this repo's Playwright e2e suite - separate from the
Vitest + Testing Library unit tests under `src/` (`pnpm test`). Run it with:

```bash
pnpm test:e2e
```

## Multi-app dependency

`frontend-shell` is a Module Federation **host**: on its own it can only get
you so far, because real auth and data live in a separate backend, and part
of its UI is a remote module served by another app. Playwright only starts
**this** repo's dev server automatically (`pnpm dev`, on port 8080 - see
`webServer` in `playwright.config.ts`). Before running `pnpm test:e2e`, you
also need, running separately:

- **backend** (sibling repo, `http://localhost:3000`) - required. The auth
  test logs in via the real `POST /auth/login` and then hits the protected
  `GET /users`; without the backend running, login will fail.
  ```bash
  cd ../backend && pnpm start:dev
  ```
- **react-app** (sibling repo, `http://localhost:8081`) - optional for the
  current auth test. It's the Module Federation remote rendered by
  `RemoteWidget`; if it isn't running, `RemoteWidget` fails gracefully behind
  an `ErrorBoundary`/`Suspense` fallback instead of breaking the page (see
  `src/components/RemoteWidget.tsx`). Start it anyway for a realistic
  full-app run:
  ```bash
  cd ../react-app && pnpm dev
  ```

## Seeding the test user

The auth test logs in with a real email/password account. The backend has no
public "register" endpoint (only `POST /auth/login` - see
`backend/src/auth/auth.controller.ts`), and its own test suite never touches
a real database (its auth specs mock `UsersService`/Prisma entirely), so
there's no existing "create a user for tests" helper to reuse.

Instead, `playwright.config.ts`'s `globalSetup`/`globalTeardown`
(`e2e/global-setup.ts` / `e2e/global-teardown.ts`) seed and clean up a single
fixture user directly in the backend's Postgres database for every
`pnpm test:e2e` run, via a direct `pg` connection (password hashed with
`argon2`, the same library the backend uses to verify it).

By default this connects to the same local database
`backend/.env.example`/`backend/docker-compose.yml` describe
(`postgresql://dev:dev_password@localhost:5432/projekt`). If your local
backend points at a different database (check its `backend/.env`'s
`DATABASE_URL`), set the following env vars before running the tests:

| Env var             | Default                                                | Purpose                                              |
| ------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| `E2E_DATABASE_URL`  | `postgresql://dev:dev_password@localhost:5432/projekt` | Postgres connection used to seed/clean up            |
| `E2E_TEST_EMAIL`    | `e2e-test-user@example.com`                            | Fixture user's email                                 |
| `E2E_TEST_PASSWORD` | `E2eTestPassword123!`                                  | Fixture user's password                              |
| `API_URL`           | `http://localhost:3000`                                | Backend base URL (mirrors the shell's own `API_URL`) |

Google OAuth is **not** exercised end to end here - it requires a real
external provider and can't be reliably automated. The test only asserts the
"Sign in with Google" button is present and points at the backend's
`/auth/google` endpoint (mirroring the existing unit test in
`src/components/LoginScreen.test.tsx`).

## CI

Not wired into a GitHub Actions workflow yet: doing that properly means
standing up the backend (+ its database) and react-app in CI too, which is
its own follow-up task once we decide how to run a multi-app e2e suite there.
For now this is meant to be run locally, with all three apps up as described
above.
