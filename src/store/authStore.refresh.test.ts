import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './authStore';

// Integration test for requirement (d) of the refresh-interceptor spec:
// unlike authStore.test.ts (which mocks src/api/auth entirely, so it can
// never exercise the interceptor), this test leaves api/auth and
// api/httpClient un-mocked so checkAuth() runs through the *real* chain -
// fetchCurrentUser -> apiFetch -> fetch. It proves that a page reload with
// an expired access_token cookie but a still-valid refresh_token cookie
// keeps the user logged in transparently, instead of bouncing to
// LoginScreen.
describe('authStore.checkAuth integration with the refresh interceptor', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: false, isAuthChecked: false });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs the user back in transparently when the access token is expired but refresh succeeds', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    let meCalls = 0;

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ message: 'Token refreshed' }),
        });
      }
      if (url.includes('/auth/me')) {
        meCalls += 1;
        if (meCalls === 1) {
          return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: '1', email: 'jane@example.com' }),
        });
      }
      throw new Error(`Unexpected fetch call to ${url}`);
    });

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().user).toEqual({ id: '1', email: 'jane@example.com' });
    expect(useAuthStore.getState().isAuthChecked).toBe(true);
    expect(meCalls).toBe(2);
  });

  it('falls back to logged-out state when both the access and refresh tokens are invalid', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
      }
      if (url.includes('/auth/me')) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
      }
      if (url.includes('/auth/logout')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
      throw new Error(`Unexpected fetch call to ${url}`);
    });

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthChecked).toBe(true);
  });
});
