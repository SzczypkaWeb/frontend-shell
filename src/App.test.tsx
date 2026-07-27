import { render, screen, waitFor } from '@testing-library/react';
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
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
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
