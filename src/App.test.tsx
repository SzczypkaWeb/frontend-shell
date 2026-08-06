import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

// Stub the Module Federation remote loader so App-level tests don't depend on a real
// 'reactApp' remote (remoteEntry.js) being reachable.
vi.mock('./remotes/reactAppWidget', () => ({
  loadReactAppWidget: vi.fn().mockResolvedValue({
    default: () => <div data-testid="remote-widget-stub">Remote widget stub</div>,
  }),
}));

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
      // fetchUsers unwraps a paginated { data, total } envelope (see
      // useUsers.ts) rather than a bare array.
      json: async () => ({
        data: [{ id: '1', email: 'a@example.com', createdAt: '2026-01-01' }],
        total: 1,
      }),
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
      // Default behavior for other endpoints (users) - fetchUsers unwraps a
      // paginated { data, total } envelope (see useUsers.ts), not a bare array.
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [{ id: '1', email: 'user@example.com', createdAt: '2026-01-01' }],
          total: 1,
        }),
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
      // fetchUsers unwraps a paginated { data, total } envelope (see
      // useUsers.ts), not a bare array.
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [{ id: '1', email: 'user@example.com', createdAt: '2026-01-01' }],
          total: 1,
        }),
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

describe('App - remote widget (Module Federation host)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        // fetchUsers unwraps a paginated { data, total } envelope (see
        // useUsers.ts), not a bare array.
        json: async () => ({ data: [], total: 0 }),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the remote Widget exposed by the reactApp remote, lazily, on the main page', async () => {
    renderApp();

    // The remote is loaded asynchronously (React.lazy + Suspense), so it isn't present
    // synchronously on first render.
    expect(screen.queryByTestId('remote-widget-stub')).not.toBeInTheDocument();

    expect(await screen.findByTestId('remote-widget-stub')).toBeInTheDocument();
  });
});
