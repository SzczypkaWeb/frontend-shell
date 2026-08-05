import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

// Keep this test focused on AppShell's own responsibilities: calling
// checkAuth on mount, rendering Navbar, and deciding between a loading
// state / LoginScreen / App based on *actual* auth state (not the URL) -
// the remote widget and users list are covered by App.test.tsx already.
vi.mock('./remotes/reactAppWidget', () => ({
  loadReactAppWidget: vi.fn().mockResolvedValue({ default: () => null }),
}));

vi.mock('./store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const checkAuth = vi.fn();
const logout = vi.fn();

interface MockAuthState {
  checkAuth: typeof checkAuth;
  logout: typeof logout;
  user: { id: string; email: string } | null;
  isAuthChecked: boolean;
}

async function mockAuthState(state: MockAuthState) {
  const { useAuthStore } = await import('./store/authStore');
  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (s: MockAuthState) => unknown) => selector(state),
  );
}

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
    vi.stubGlobal('location', { ...window.location, pathname: '/', assign: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('calls checkAuth once on mount to restore session state', async () => {
    await mockAuthState({ checkAuth, logout, user: null, isAuthChecked: false });

    renderWithProviders();

    expect(checkAuth).toHaveBeenCalledTimes(1);
  });

  it('always renders the Navbar', async () => {
    await mockAuthState({ checkAuth, logout, user: null, isAuthChecked: true });

    renderWithProviders();

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows a loading state while the initial checkAuth() call is still pending, and renders neither LoginScreen nor App', async () => {
    await mockAuthState({ checkAuth, logout, user: null, isAuthChecked: false });

    renderWithProviders();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /log in/i })).not.toBeInTheDocument();
    expect(screen.queryByText('shell działa')).not.toBeInTheDocument();
  });

  it('never fetches protected data while checkAuth is still pending', async () => {
    await mockAuthState({ checkAuth, logout, user: null, isAuthChecked: false });

    renderWithProviders();

    expect(fetch).not.toHaveBeenCalled();
  });

  it('renders LoginScreen once checkAuth resolves unauthenticated, even at path "/"', async () => {
    await mockAuthState({ checkAuth, logout, user: null, isAuthChecked: true });

    renderWithProviders();

    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  });

  it('never mounts App (and never fetches protected data) once confirmed logged out', async () => {
    await mockAuthState({ checkAuth, logout, user: null, isAuthChecked: true });

    renderWithProviders();

    expect(screen.queryByText('shell działa')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('renders the home content (App) once checkAuth resolves authenticated', async () => {
    await mockAuthState({
      checkAuth,
      logout,
      user: { id: '1', email: 'jane@example.com' },
      isAuthChecked: true,
    });

    renderWithProviders();

    expect(await screen.findByText('shell działa')).toBeInTheDocument();
  });

  it('redirects an already-authenticated user away from /login to home, instead of showing the login form again', async () => {
    const assignMock = vi.fn();
    vi.stubGlobal('location', { ...window.location, pathname: '/login', assign: assignMock });
    await mockAuthState({
      checkAuth,
      logout,
      user: { id: '1', email: 'jane@example.com' },
      isAuthChecked: true,
    });

    renderWithProviders();

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/'));
  });
});
