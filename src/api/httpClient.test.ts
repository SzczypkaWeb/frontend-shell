import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// httpClient centralizes the 401 -> refresh -> retry flow so no individual
// hook/module has to duplicate it (see src/hooks/useUsers.ts, which used to
// do this itself before this interceptor existed). The auth store is mocked
// here so we can assert on the "give up and log out" branch in isolation -
// the store's own behavior is covered by authStore.test.ts, and the real
// end-to-end wiring (through the real store) is covered by
// src/store/authStore.refresh.test.ts.
vi.mock('../store/authStore', () => ({
  useAuthStore: { getState: vi.fn() },
}));

import { apiFetch } from './httpClient';
import { useAuthStore } from '../store/authStore';

function jsonResponse(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('apiFetch 401 -> refresh -> retry interceptor', () => {
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logout = vi.fn().mockResolvedValue(undefined);
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ logout });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('passes through a successful response untouched, without calling refresh', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { id: '1' }));

    const res = await apiFetch('/users');

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it('on a 401, refreshes the access token and transparently retries the original request', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401)) // GET /users -> expired access token
      .mockResolvedValueOnce(jsonResponse(200)) // POST /auth/refresh -> new access_token cookie
      .mockResolvedValueOnce(jsonResponse(200, [{ id: '1' }])); // retried GET /users -> succeeds

    const res = await apiFetch('/users');

    expect(res.ok).toBe(true);
    expect(await res.json()).toEqual([{ id: '1' }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain('/users');
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'POST' }));
    expect(fetchMock.mock.calls[2][0]).toContain('/users');
    // The caller never observes the intermediate 401 - only the final result.
    expect(logout).not.toHaveBeenCalled();
  });

  it('logs out and propagates the original 401 when the refresh call itself fails', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401)) // GET /users -> expired access token
      .mockResolvedValueOnce(jsonResponse(401)); // POST /auth/refresh -> refresh token also invalid/expired

    const res = await apiFetch('/users');

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2); // no further retry of the original request
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('does not retry more than once, even if the retried request also 401s', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401)) // GET /users -> expired access token
      .mockResolvedValueOnce(jsonResponse(200)) // POST /auth/refresh -> succeeds
      .mockResolvedValueOnce(jsonResponse(401)); // retried GET /users -> still 401 (e.g. revoked)

    const res = await apiFetch('/users');

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    // A single successful refresh is not treated as a failed refresh, so
    // logout is not triggered again here - the caller just sees the 401.
    expect(logout).not.toHaveBeenCalled();
  });

  it('never tries to refresh off a 401 from the refresh endpoint itself', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse(401));

    const res = await apiFetch('/auth/refresh', { method: 'POST' });

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it('never tries to refresh off a 401 from the logout endpoint (would recurse into logout())', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse(401));

    const res = await apiFetch('/auth/logout', { method: 'POST' });

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it('coalesces multiple concurrent 401s into a single refresh call', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const callsPerUrl = new Map<string, number>();

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        const count = (callsPerUrl.get('refresh') ?? 0) + 1;
        callsPerUrl.set('refresh', count);
        return Promise.resolve(jsonResponse(200));
      }

      const count = (callsPerUrl.get(url) ?? 0) + 1;
      callsPerUrl.set(url, count);
      // First call for each distinct URL simulates an expired access token;
      // the retry (second call) succeeds.
      return Promise.resolve(jsonResponse(count === 1 ? 401 : 200));
    });

    const [usersRes, listingsRes, profileRes] = await Promise.all([
      apiFetch('/users'),
      apiFetch('/listings'),
      apiFetch('/profile'),
    ]);

    expect(usersRes.status).toBe(200);
    expect(listingsRes.status).toBe(200);
    expect(profileRes.status).toBe(200);
    expect(callsPerUrl.get('refresh')).toBe(1);
    expect(logout).not.toHaveBeenCalled();
  });
});
