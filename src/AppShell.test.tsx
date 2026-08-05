import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

// Keep this test focused on AppShell's own responsibilities (calling
// checkAuth on mount, rendering Navbar, switching between the login screen
// and the home content) - the remote widget and users list are covered by
// App.test.tsx already.
vi.mock('./remotes/reactAppWidget', () => ({
  loadReactAppWidget: vi.fn().mockResolvedValue({ default: () => null }),
}));

const checkAuth = vi.fn();
vi.mock('./store/authStore', () => ({
  useAuthStore: (
    selector: (s: { checkAuth: typeof checkAuth; user: null; logout: () => void }) => unknown,
  ) => selector({ checkAuth, user: null, logout: vi.fn() }),
}));

function renderWithProviders() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('calls checkAuth once on mount to restore session state', () => {
    renderWithProviders();

    expect(checkAuth).toHaveBeenCalledTimes(1);
  });

  it('always renders the Navbar', () => {
    renderWithProviders();

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders the home content when the path is not /login', async () => {
    renderWithProviders();

    expect(await screen.findByText('shell działa')).toBeInTheDocument();
  });

  it('renders the login screen when the path is /login', () => {
    vi.stubGlobal('location', { ...window.location, pathname: '/login' });

    renderWithProviders();

    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  });
});
