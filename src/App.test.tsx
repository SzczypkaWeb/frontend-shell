import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

function renderApp() {
  // Disable retries so failed requests reject immediately in tests.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App - users list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the loading indicator before the users data arrives', async () => {
    // Keep the fetch promise pending so the component stays in the loading state
    // until we explicitly resolve it below.
    let resolveFetch!: (value: unknown) => void;
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    renderApp();

    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();

    resolveFetch({
      ok: true,
      json: async () => [{ id: '1', email: 'a@example.com', createdAt: '2026-01-01' }],
    });

    await waitFor(() => expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument());
    expect(screen.getByText('a@example.com')).toBeInTheDocument();
  });

  it('renders an error message when the request fails', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    renderApp();

    await waitFor(() => expect(screen.getByText(/Błąd:/)).toBeInTheDocument());
  });
});

describe('App - version display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the app version when both requests succeed', async () => {
    // Mock fetch to handle both users and version requests
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/version')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ version: '1.2.3' }),
        });
      }
      // Default behavior for other endpoints (users)
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: '1', email: 'user@example.com', createdAt: '2026-01-01' }],
      });
    });

    renderApp();

    await waitFor(() => expect(screen.getByText('v1.2.3')).toBeInTheDocument());
  });

  it('still renders the app even if version fetch fails', async () => {
    // Create a fresh mock for this test
    const mockFetch = vi.fn();
    (globalThis as Record<string, unknown>).fetch = mockFetch;

    mockFetch.mockImplementation((url: string) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/version')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({}),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: '1', email: 'user@example.com', createdAt: '2026-01-01' }],
      });
    });

    renderApp();

    // App should render normally even if version fetch failed
    await waitFor(() => expect(screen.getByText('user@example.com')).toBeInTheDocument());
    // Verify version calls that failed weren't displayed - the component should return null
    // So we shouldn't see any version text
    expect(screen.queryByText(/^v/)).not.toBeInTheDocument();
  });
});
