import { defineConfig, devices } from '@playwright/test';

// Playwright config for this repo's end-to-end tests, kept in `e2e/` and run
// by its own command (`pnpm test:e2e`) - separate from the Vitest +
// Testing Library unit tests under src/ (see vitest.config.ts, whose
// `exclude` list keeps it out of this directory the other way around).
//
// IMPORTANT - multi-app dependency: frontend-shell is a Module Federation
// HOST. These tests only exercise this repo (the auth guard, login/logout -
// see src/AppShell.tsx), but the shell itself talks to two other apps that
// must be running for the flow to actually work end to end:
//   - backend (http://localhost:3000, sibling repo) - real auth
//     (POST /auth/login) and the protected GET /users endpoint the shell
//     calls once logged in. Required for auth.spec.ts to pass.
//   - react-app (http://localhost:8081, sibling repo) - the Module
//     Federation remote rendered by RemoteWidget. NOT required for
//     auth.spec.ts: RemoteWidget fails gracefully behind an
//     ErrorBoundary/Suspense if the remote is unreachable (see
//     src/components/RemoteWidget.tsx), but should be running for a
//     realistic full-app manual run.
// See e2e/README.md for full setup instructions, including how to seed the
// test user these tests log in as.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Starts this repo's own dev server automatically, reusing the same port
  // (8080) `pnpm dev` already serves on. The backend and react-app are
  // separate processes/repos and are deliberately NOT started here - see the
  // multi-app dependency note above.
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
