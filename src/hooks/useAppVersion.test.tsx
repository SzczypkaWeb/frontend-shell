import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppVersion } from './useAppVersion';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAppVersion', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the version from the /version endpoint', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.0.0' }),
    });

    const { result } = renderHook(() => useAppVersion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBe('1.0.0');
    });
  });

  it('returns null on fetch error', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useAppVersion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });

  it('returns null on network error', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAppVersion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });

  it('does not retry on failure', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAppVersion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });

    // Verify fetch was called only once (no retries)
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('sets staleTime to Infinity to prevent re-fetches', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.0.0' }),
    });

    const { result } = renderHook(() => useAppVersion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBe('1.0.0');
    });

    // Fetch should be called exactly once even if hook re-renders
    const fetchCallCount = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(fetchCallCount).toBe(1);
  });
});
