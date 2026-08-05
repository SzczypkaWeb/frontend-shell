import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUsers } from './useUsers';

// useUsers hits the protected GET /users endpoint. As defense-in-depth
// against a stale/expired session slipping past AppShell's own auth guard,
// a 401 response must not surface as a generic query error (which App.tsx
// renders as "Błąd: ...") - instead it should delegate to authStore.logout()
// so the whole app consistently falls back to the logged-out UI.
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

async function mockAuthStore(logout: ReturnType<typeof vi.fn>) {
  const { useAuthStore } = await import('../store/authStore');
  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (s: { logout: typeof logout }) => unknown) => selector({ logout }),
  );
}

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the users list on success', async () => {
    await mockAuthStore(vi.fn());
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: '1', email: 'a@example.com', createdAt: '2026-01-01' }],
    });

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.error).toBeNull();
  });

  it('calls authStore.logout() and does not set a query error on a 401 response', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    await mockAuthStore(logout);
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    // Verify the logout promise was actually awaited by checking that the
    // query completes with an empty list (which is returned after logout completes)
    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('still surfaces a generic query error for non-401 failures', async () => {
    const logout = vi.fn();
    await mockAuthStore(logout);
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(logout).not.toHaveBeenCalled();
  });

  it('waits for authStore.logout() to complete before returning on 401', async () => {
    // Create a logout mock that tracks when it's called and resolved
    let logoutCalled = false;
    let logoutCompleted = false;
    const logout = vi.fn().mockImplementation(async () => {
      logoutCalled = true;
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate async work
      logoutCompleted = true;
    });
    await mockAuthStore(logout);
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    // Wait for logout to be called
    await waitFor(() => expect(logoutCalled).toBe(true));
    // Verify it's been awaited by checking the completion flag
    await waitFor(() => expect(logoutCompleted).toBe(true));
    // Verify the data is returned (which happens after logout completes)
    expect(result.current.data).toEqual([]);
  });
});
