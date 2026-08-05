import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUsers } from './useUsers';

// useUsers hits the protected GET /users endpoint. Session recovery/logout
// on a 401 is now handled centrally by apiFetch's refresh interceptor (see
// src/api/httpClient.test.ts): it silently retries once after a refresh, and
// calls authStore.logout() itself if the refresh fails. So by the time a 401
// reaches this hook, logout has already been triggered - useUsers only needs
// to make sure that doesn't surface as a generic query error (which App.tsx
// renders as "Błąd: ...") to a user who is already being logged out.
function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useUsers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the users list on success', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: '1', email: 'a@example.com', createdAt: '2026-01-01' }],
    });

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.error).toBeNull();
  });

  it('resolves to an empty list (not a query error) on a 401 response', async () => {
    // apiFetch will itself try to refresh on this 401; here every call
    // (including the refresh) 401s, exercising the "refresh already failed"
    // fallback path this hook is left to handle.
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('still surfaces a generic query error for non-401 failures', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
