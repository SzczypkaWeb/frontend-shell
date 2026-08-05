import { create } from 'zustand';
import { fetchCurrentUser, loginRequest, logoutRequest } from '../api/auth';
import type { User } from '../types/user';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  /**
   * Whether the initial checkAuth() call (run once on app mount) has
   * resolved yet. Distinct from `isLoading` (which is shared with
   * login/logout) so consumers like AppShell can tell "still checking" apart
   * from "confirmed logged out" and avoid a flash of the wrong screen.
   */
  isAuthChecked: boolean;
  /** Logs in with email/password and stores the returned user on success. */
  login: (email: string, password: string) => Promise<void>;
  /** Clears the session (backend cookies + local user). */
  logout: () => Promise<void>;
  /** Calls GET /auth/me to restore session state - intended to run on app mount. */
  checkAuth: () => Promise<void>;
}

// Exposed as a Module Federation shared singleton (see webpack.config.ts) so
// that once react-app consumes it, both the shell and react-app read/write
// the exact same store instance rather than each holding their own copy.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthChecked: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const user = await loginRequest(email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutRequest();
    } catch (error) {
      // Even if the backend call fails (e.g. network error), drop the local
      // user - staying "logged in" client-side while the request failed
      // would be misleading, and the httpOnly cookies will simply expire.
      console.debug('Logout request failed', error);
    } finally {
      set({ user: null, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await fetchCurrentUser();
      set({ user, isLoading: false, isAuthChecked: true });
    } catch {
      // 401 / not authenticated - not an error state, just "no session".
      set({ user: null, isLoading: false, isAuthChecked: true });
    }
  },
}));
