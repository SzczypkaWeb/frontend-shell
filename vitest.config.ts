import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Playwright's e2e suite (see playwright.config.ts) lives in e2e/ and is
    // run by its own command (`pnpm test:e2e`) - it must never be picked up
    // by Vitest, whose default include glob would otherwise also match
    // e2e/*.spec.ts.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
