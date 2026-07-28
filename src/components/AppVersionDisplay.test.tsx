import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppVersionDisplay } from './AppVersionDisplay';

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

describe('AppVersionDisplay', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the version when the fetch succeeds', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.2.3' }),
    });

    renderWithQueryClient(<AppVersionDisplay />);

    // The version should appear in the document after the query resolves
    const versionText = await screen.findByText('v1.2.3');
    expect(versionText).toBeInTheDocument();
  });

  it('renders nothing when the fetch fails', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const { container } = renderWithQueryClient(<AppVersionDisplay />);

    // Wait a moment for the query to settle, then verify nothing was rendered
    await new Promise((resolve) => setTimeout(resolve, 100));
    // The container should only have text nodes (from React's internal structure),
    // not the version text
    expect(container.textContent).not.toContain('v');
  });

  it('renders nothing when the fetch throws an error', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { container } = renderWithQueryClient(<AppVersionDisplay />);

    // Wait a moment for the query to settle
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(container.textContent).not.toContain('v');
  });

  it('includes a tooltip with the full version', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ version: '2.0.0' }),
    });

    renderWithQueryClient(<AppVersionDisplay />);

    const versionText = await screen.findByText('v2.0.0');
    expect(versionText).toHaveAttribute('title', 'App version: 2.0.0');
  });
});
