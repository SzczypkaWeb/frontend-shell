import { API_BASE_URL } from './config';

// Shared fetch wrapper: resolves every request against the configured
// backend base URL, so no consumer needs to hardcode a host. Always sends
// credentials (cookies) - the backend's auth is cookie-based (httpOnly
// access/refresh tokens), so every request needs `credentials: 'include'`
// for the browser to attach them. Callers may still override this via `init`.
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, { credentials: 'include', ...init });
}
