import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./AppShell', () => ({
  AppShell: () => <div data-testid="app-shell" />,
}));

describe('bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    cleanup();
  });

  it('renders AppShell into #root', async () => {
    await import('./bootstrap');

    expect(await screen.findByTestId('app-shell')).toBeInTheDocument();
  });

  it('imports the Tailwind CSS entry file itself, not index.tsx, since index.tsx is only the dynamic-import boundary', () => {
    const bootstrapSource = readFileSync(path.resolve(__dirname, './bootstrap.tsx'), 'utf-8');
    const indexSource = readFileSync(path.resolve(__dirname, './index.tsx'), 'utf-8');

    expect(bootstrapSource).toMatch(/import\s+['"]\.\/styles\.css['"]/);
    expect(indexSource).not.toMatch(/styles\.css/);
  });

  // GET /auth/me and POST /auth/logout are now fully implemented by the real
  // backend (real JWT auth, Google OAuth, refresh flow), so MSW must no
  // longer intercept them in local dev - otherwise a genuinely authenticated
  // user (real httpOnly cookies from a real Google login) would still be
  // treated as logged out, because the stale mock for GET /auth/me always
  // returned 401 before the request ever reached the backend.
  it('does not wire up MSW mocking anymore - auth requests must pass through to the real backend', () => {
    const bootstrapSource = readFileSync(path.resolve(__dirname, './bootstrap.tsx'), 'utf-8');

    expect(bootstrapSource).not.toMatch(/mocks\/browser/);
    expect(bootstrapSource).not.toMatch(/msw/i);
  });

  it('removes the now-redundant MSW mock files, since handlers.ts only ever mocked /auth/me and /auth/logout', () => {
    expect(existsSync(path.resolve(__dirname, './mocks/handlers.ts'))).toBe(false);
    expect(existsSync(path.resolve(__dirname, './mocks/browser.ts'))).toBe(false);
  });
});
