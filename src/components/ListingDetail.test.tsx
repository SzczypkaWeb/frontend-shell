import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingDetail } from './ListingDetail';

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

describe('ListingDetail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the listing title and description when data loads', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        title: 'Beautiful Apartment',
        description: 'Spacious 2-bedroom apartment in the city center',
        viewCount: 42,
        createdAt: '2026-01-15T10:00:00Z',
      }),
    });

    renderWithQueryClient(<ListingDetail id="1" />);

    const title = await screen.findByText('Beautiful Apartment');
    const description = await screen.findByText('Spacious 2-bedroom apartment in the city center');

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();
  });

  it('displays view count with singular "view" when viewCount is 1', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        title: 'Test Listing',
        description: 'A test listing',
        viewCount: 1,
        createdAt: '2026-01-15T10:00:00Z',
      }),
    });

    renderWithQueryClient(<ListingDetail id="1" />);

    const viewCountText = await screen.findByText('1 view');
    expect(viewCountText).toBeInTheDocument();
  });

  it('displays view count with plural "views" when viewCount is greater than 1', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        title: 'Popular Listing',
        description: 'A popular listing',
        viewCount: 123,
        createdAt: '2026-01-15T10:00:00Z',
      }),
    });

    renderWithQueryClient(<ListingDetail id="1" />);

    const viewCountText = await screen.findByText('123 views');
    expect(viewCountText).toBeInTheDocument();
  });

  it('displays "0 views" when viewCount is 0', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        title: 'New Listing',
        description: 'A new listing with no views',
        viewCount: 0,
        createdAt: '2026-01-15T10:00:00Z',
      }),
    });

    renderWithQueryClient(<ListingDetail id="1" />);

    const viewCountText = await screen.findByText('0 views');
    expect(viewCountText).toBeInTheDocument();
  });

  it('displays "0 views" gracefully when viewCount is undefined', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        title: 'Listing Without ViewCount',
        description: 'A listing without view count info',
        createdAt: '2026-01-15T10:00:00Z',
      }),
    });

    renderWithQueryClient(<ListingDetail id="1" />);

    const viewCountText = await screen.findByText('0 views');
    expect(viewCountText).toBeInTheDocument();
  });

  it('renders loading state initially', () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));

    const { container } = renderWithQueryClient(<ListingDetail id="pending-id" />);

    // Should show loading text while fetching
    expect(container.textContent).toContain('Ładowanie');
  });

  it('renders error state when fetch fails', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    renderWithQueryClient(<ListingDetail id="error-id" />);

    const errorText = await screen.findByText(/błąd/i);
    expect(errorText).toBeInTheDocument();
  });

  it('renders error state when fetch throws', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    renderWithQueryClient(<ListingDetail id="network-error-id" />);

    const errorText = await screen.findByText(/błąd/i);
    expect(errorText).toBeInTheDocument();
  });

  it('fetches data with the correct id parameter', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'listing-123',
        title: 'Test',
        description: 'Test description',
        viewCount: 10,
        createdAt: '2026-01-15T10:00:00Z',
      }),
    });

    (global.fetch as unknown as ReturnType<typeof vi.fn>) = fetchMock;

    renderWithQueryClient(<ListingDetail id="listing-123" />);

    await screen.findByText('Test');

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/listings/listing-123'));
  });
});
