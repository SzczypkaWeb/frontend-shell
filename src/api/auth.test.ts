import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCurrentUser, loginRequest, logoutRequest } from './auth';

// Contract under test (see task spec):
// - POST /auth/login accepts { email, password }; the backend sets httpOnly
//   cookies and returns the user in the body (never a token).
// - GET /auth/me returns the current user, or a non-2xx (401) when unauthenticated.
// - POST /auth/logout clears the session cookies.
// - Every request must be sent with `credentials: 'include'` so the browser
//   attaches the httpOnly cookies.
describe('auth API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('loginRequest', () => {
    it('POSTs { email, password } to /auth/login with credentials included', async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ id: '1', email: 'jane@example.com' }),
      });

      await loginRequest('jane@example.com', 'secret123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ email: 'jane@example.com', password: 'secret123' }),
        }),
      );
    });

    it('resolves with the user object from the response body', async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ id: '1', email: 'jane@example.com' }),
      });

      const user = await loginRequest('jane@example.com', 'secret123');

      expect(user).toEqual({ id: '1', email: 'jane@example.com' });
    });

    it('never touches localStorage/sessionStorage - tokens are cookie-only', async () => {
      const setLocalStorage = vi.spyOn(Storage.prototype, 'setItem');
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ id: '1', email: 'jane@example.com' }),
      });

      await loginRequest('jane@example.com', 'secret123');

      expect(setLocalStorage).not.toHaveBeenCalled();
      setLocalStorage.mockRestore();
    });

    it('rejects when the backend refuses the credentials', async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(loginRequest('jane@example.com', 'wrong-password')).rejects.toThrow();
    });
  });

  describe('fetchCurrentUser', () => {
    it('GETs /auth/me with credentials included', async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ id: '1', email: 'jane@example.com' }),
      });

      await fetchCurrentUser();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    it('resolves with the current user when authenticated', async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ id: '1', email: 'jane@example.com' }),
      });

      const user = await fetchCurrentUser();

      expect(user).toEqual({ id: '1', email: 'jane@example.com' });
    });

    it('rejects when the backend responds 401 (not authenticated)', async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(fetchCurrentUser()).rejects.toThrow();
    });
  });

  describe('logoutRequest', () => {
    it('POSTs to /auth/logout with credentials included', async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await logoutRequest();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
    });
  });
});
