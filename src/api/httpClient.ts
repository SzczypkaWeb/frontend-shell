import { API_BASE_URL } from './config';

// Shared fetch wrapper: resolves every request against the configured
// backend base URL, so no consumer needs to hardcode a host.
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, init);
}
