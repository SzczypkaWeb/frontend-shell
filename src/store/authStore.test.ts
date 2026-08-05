import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../types/user';

// The store delegates all network access to src/api/auth.ts, so we mock that
// module and assert on the store's *state transitions*, independent of fetch
// details (those are covered by src/api/auth.test.ts).
vi.mock('../api/auth', () => ({
  loginRequest: vi.fn(),
  fetchCurrentUser: vi.fn(),
  logoutRequest: vi.fn(),
}));

const mockUser: User = { id: '1', email: 'jane@example.com' };

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('starts with no user and isLoading false', async () => {
    const { useAuthStore } = await import('./authStore');

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  describe('login', () => {
    it('calls loginRequest with the given credentials and stores the returned user', async () => {
      const { loginRequest } = await import('../api/auth');
      const { useAuthStore } = await import('./authStore');
      (loginRequest as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      await useAuthStore.getState().login('jane@example.com', 'secret123');

      expect(loginRequest).toHaveBeenCalledWith('jane@example.com', 'secret123');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('leaves the user unset and rethrows when login fails', async () => {
      const { loginRequest } = await import('../api/auth');
      const { useAuthStore } = await import('./authStore');
      const loginError = new Error('Invalid credentials');
      (loginRequest as ReturnType<typeof vi.fn>).mockRejectedValue(loginError);

      await expect(useAuthStore.getState().login('jane@example.com', 'wrong')).rejects.toThrow(
        'Invalid credentials',
      );

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('calls logoutRequest and clears the user', async () => {
      const { logoutRequest } = await import('../api/auth');
      const { useAuthStore } = await import('./authStore');
      (logoutRequest as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      useAuthStore.setState({ user: mockUser });

      await useAuthStore.getState().logout();

      expect(logoutRequest).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('still clears the local user even if the logout request fails', async () => {
      const { logoutRequest } = await import('../api/auth');
      const { useAuthStore } = await import('./authStore');
      (logoutRequest as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network error'));
      useAuthStore.setState({ user: mockUser });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('sets the user when GET /auth/me resolves (existing session)', async () => {
      const { fetchCurrentUser } = await import('../api/auth');
      const { useAuthStore } = await import('./authStore');
      (fetchCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      await useAuthStore.getState().checkAuth();

      expect(fetchCurrentUser).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading true while the check is in flight', async () => {
      const { fetchCurrentUser } = await import('../api/auth');
      const { useAuthStore } = await import('./authStore');
      let resolveFetch!: (user: User) => void;
      (fetchCurrentUser as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => (resolveFetch = resolve)),
      );

      const pending = useAuthStore.getState().checkAuth();
      expect(useAuthStore.getState().isLoading).toBe(true);

      resolveFetch(mockUser);
      await pending;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('clears the user when GET /auth/me rejects (401, not authenticated)', async () => {
      const { fetchCurrentUser } = await import('../api/auth');
      const { useAuthStore } = await import('./authStore');
      (fetchCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Not authenticated'),
      );
      useAuthStore.setState({ user: mockUser });

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
