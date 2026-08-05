import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../api/config';

// Temporary handlers for backend endpoints that don't exist yet:
// GET /auth/me and POST /auth/logout (see backend/src/auth/auth.module.ts -
// only POST /auth/login is implemented/deployed today). These let the shell
// be built and manually exercised against the documented contract before the
// backend ships the real routes. src/api/auth.ts always calls the real paths
// via fetch, so once the backend implements them, delete this file and stop
// starting the worker in src/index.tsx - no other code changes are needed.
//
// Kept intentionally simple/stateless: GET /auth/me always reports "not
// authenticated", since a real session check requires reading the httpOnly
// cookie server-side, which a browser-side mock cannot do. authStore.login()
// already updates the UI optimistically from the real /auth/login response,
// so this only affects the "restore session on page reload" path.
export const handlers = [
  http.get(`${API_BASE_URL}/auth/me`, () => {
    return new HttpResponse(null, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
