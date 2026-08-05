import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../types/user';

// Navbar reads auth state through the shared authStore. We mock the store so
// each test can drive it into a specific (authenticated / anonymous) state
// without going through real network calls.
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockUser: User = { id: '1', email: 'jane@example.com' };

async function setupNavbar(state: { user: User | null; logout: ReturnType<typeof vi.fn> }) {
  const { useAuthStore } = await import('../store/authStore');
  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
  const { Navbar } = await import('./Navbar');
  return render(<Navbar />);
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a Login link when no user is authenticated', async () => {
    await setupNavbar({ user: null, logout: vi.fn() });

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('renders the Login link as a shared-ui Button component', async () => {
    await setupNavbar({ user: null, logout: vi.fn() });

    const loginButton = screen.getByRole('button', { name: /login/i });
    // Verify it's the shared-ui Button component by checking for its Tailwind classes
    expect(loginButton.className).toEqual(expect.stringContaining('inline-flex'));
    expect(loginButton.className).toEqual(expect.stringContaining('items-center'));
    expect(loginButton.className).toEqual(expect.stringContaining('justify-center'));
  });

  it("shows the user's email and a Logout button when authenticated", async () => {
    await setupNavbar({ user: mockUser, logout: vi.fn() });

    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
  });

  it('renders the Logout button as a shared-ui Button component', async () => {
    await setupNavbar({ user: mockUser, logout: vi.fn() });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    // Verify it's the shared-ui Button component by checking for its Tailwind classes
    expect(logoutButton.className).toEqual(expect.stringContaining('inline-flex'));
    expect(logoutButton.className).toEqual(expect.stringContaining('items-center'));
    expect(logoutButton.className).toEqual(expect.stringContaining('justify-center'));
  });

  it('calls authStore.logout() when the Logout button is clicked', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    await setupNavbar({ user: mockUser, logout });

    await userEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('renders inside a navigation landmark', async () => {
    const { container } = await setupNavbar({ user: null, logout: vi.fn() });

    expect(within(container).getByRole('navigation')).toBeInTheDocument();
  });
});
