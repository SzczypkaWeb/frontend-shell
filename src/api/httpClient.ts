import { API_BASE_URL } from './config';
import { useAuthStore } from '../store/authStore';

// Path of the backend's refresh endpoint (see backend/src/auth/auth.controller.ts
// - POST /auth/refresh, guarded by JwtRefreshGuard, reads the refresh_token
// cookie and re-issues a fresh access_token cookie). The refresh_token
// cookie itself is scoped by the backend to this exact path, so it is only
// ever sent on this request.
const REFRESH_PATH = '/auth/refresh';

// Auth-infrastructure paths that must never enter the refresh-retry cycle
// themselves. /auth/refresh is excluded because a 401 there simply means
// "no valid session to recover" - trying to refresh a failed refresh makes
// no sense. /auth/logout is excluded to prevent a genuine recursion hazard:
// a failed refresh triggers authStore.logout(), which itself calls
// apiFetch('/auth/logout') - without this guard, a 401 on that logout
// request would try to refresh again and call logout() again, forever.
const AUTH_INFRA_PATHS = new Set([REFRESH_PATH, '/auth/logout']);

function rawFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, { credentials: 'include', ...init });
}

// Coalesces concurrent refresh attempts: if several requests hit a 401
// around the same time (e.g. multiple components mounting in parallel),
// they must all await the *same* in-flight POST /auth/refresh rather than
// each firing their own - doing so independently could race against
// refresh-token rotation on the backend and have one request's refresh
// invalidate another's. Resolves to whether the refresh succeeded.
let refreshInFlight: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = rawFetch(REFRESH_PATH, { method: 'POST' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

async function fetchWithRefresh(
  path: string,
  init: RequestInit | undefined,
  isRetry: boolean,
): Promise<Response> {
  const response = await rawFetch(path, init);

  // Only attempt a silent refresh for a "real" 401 on a protected request:
  // not for auth-infrastructure endpoints (see AUTH_INFRA_PATHS), and not
  // for a request that has already been retried once.
  if (response.status !== 401 || AUTH_INFRA_PATHS.has(path) || isRetry) {
    return response;
  }

  const refreshed = await refreshAccessToken();

  if (!refreshed) {
    // The refresh token is invalid/expired too - there is no way to
    // silently recover the session, so fall back to a hard logout and let
    // the original 401 propagate to the caller. AppShell already renders
    // LoginScreen once authStore's user is cleared.
    await useAuthStore.getState().logout();
    return response;
  }

  return fetchWithRefresh(path, init, true);
}

// Shared fetch wrapper: resolves every request against the configured
// backend base URL, so no consumer needs to hardcode a host. Always sends
// credentials (cookies) - the backend's auth is cookie-based (httpOnly
// access/refresh tokens), so every request needs `credentials: 'include'`
// for the browser to attach them. Callers may still override this via `init`.
//
// Centralizes 401 handling for every caller (GET /auth/me on mount, /users,
// etc.): a 401 triggers a single silent POST /auth/refresh, and on success
// the original request is transparently retried once so the caller never
// observes the intermediate failure. See fetchWithRefresh for the full
// contract.
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetchWithRefresh(path, init, false);
}
