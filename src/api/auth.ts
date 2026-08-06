import { apiFetch } from './httpClient';
import type { User } from '../types/user';

// Thin fetch wrappers around the backend's auth endpoints. `apiFetch` already
// sends `credentials: 'include'` on every request, which is required here so
// the browser attaches the httpOnly access/refresh cookies the backend sets.
//
// GET /auth/me, POST /auth/login and POST /auth/logout are all fully
// implemented and deployed on the real backend (real JWT auth, Google OAuth,
// refresh flow), so every request below always goes to the real network -
// no local mocking is needed or wired up anymore.

export async function loginRequest(email: string, password: string): Promise<User> {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('Invalid email or password');
  }

  // The backend never returns the token itself, only the user - see
  // AuthController.login in the backend repo.
  return res.json();
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await apiFetch('/auth/me');

  if (!res.ok) {
    throw new Error('Not authenticated');
  }

  return res.json();
}

export async function logoutRequest(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}
