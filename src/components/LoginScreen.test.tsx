import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// LoginScreen only talks to the backend through authStore.login(), so we mock
// the store and assert on how the component drives it - the actual network
// contract (POST /auth/login, credentials: include) is covered by
// src/api/auth.test.ts and src/store/authStore.test.ts.
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

async function setupLoginScreen(
  login: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue(undefined),
) {
  const { useAuthStore } = await import('../store/authStore');
  const state = { login, isLoading: false };
  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
  const { LoginScreen } = await import('./LoginScreen');
  return { ...renderWithQueryClient(<LoginScreen />), login };
}

describe('LoginScreen', () => {
  const assignMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('location', { ...window.location, assign: assignMock });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders email and password fields and a submit button', async () => {
    await setupLoginScreen();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('submits via the shared-ui Button component styled as the primary variant', async () => {
    await setupLoginScreen();

    const button = screen.getByRole('button', { name: /log in/i });

    // The shared-ui Button component renders its Tailwind classes as literal
    // strings (see @szczypkaweb/shared-ui's Button.tsx) so its content scanner
    // can pick them up. Asserting on them here pins the login button to that
    // component's primary variant instead of any bespoke/local styling.
    expect(button.className).toEqual(expect.stringContaining('bg-blue-600'));
    expect(button.className).toEqual(expect.stringContaining('text-white'));
    expect(button.className).toEqual(expect.stringContaining('hover:bg-blue-700'));
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('shows validation errors and does not call login when fields are empty', async () => {
    const { login } = await setupLoginScreen();

    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows a validation error and does not call login for a malformed email', async () => {
    const { login } = await setupLoginScreen();

    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('calls authStore.login with the entered email and password on valid submit', async () => {
    const { login } = await setupLoginScreen();

    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('jane@example.com', 'secret123'));
  });

  it('redirects to home on successful login', async () => {
    await setupLoginScreen(vi.fn().mockResolvedValue(undefined));

    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/'));
  });

  it('shows an error message and does not redirect when login fails', async () => {
    await setupLoginScreen(vi.fn().mockRejectedValue(new Error('Invalid email or password')));

    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(assignMock).not.toHaveBeenCalled();
  });

  it('disables the submit button and shows a loading state while the mutation is pending', async () => {
    let resolveLogin!: () => void;
    const login = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogin = resolve;
      }),
    );
    await setupLoginScreen(login);

    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled());

    resolveLogin();
    await waitFor(() => expect(screen.getByRole('button', { name: /log in/i })).not.toBeDisabled());
  });

  it('renders a Google sign-in button that navigates to the backend Google OAuth endpoint', async () => {
    await setupLoginScreen();

    const googleButton = screen.getByRole('button', {
      name: /sign in with google|zaloguj przez google/i,
    });
    expect(googleButton).toBeInTheDocument();

    // The button should have an href attribute pointing to the backend's /auth/google endpoint
    // or be an anchor tag with the proper href
    const href = googleButton.getAttribute('data-href') || googleButton.getAttribute('href');
    expect(href).toBe('http://localhost:3000/auth/google');
  });

  it('uses the API_URL environment variable for the Google OAuth button link', async () => {
    // This test ensures the Google OAuth URL is constructed from the configured API base URL
    // rather than hardcoded, so it works in different environments.
    await setupLoginScreen();

    const googleButton = screen.getByRole('button', {
      name: /sign in with google|zaloguj przez google/i,
    });
    const href = googleButton.getAttribute('data-href') || googleButton.getAttribute('href');

    // The URL should start with the API base URL (which defaults to localhost:3000 in tests)
    expect(href).toMatch(/^http:\/\/localhost:3000\/auth\/google$/);
  });

  it('navigates to Google OAuth endpoint when clicking the Google sign-in button', async () => {
    await setupLoginScreen();

    const googleButton = screen.getByRole('button', {
      name: /sign in with google|zaloguj przez google/i,
    });

    await userEvent.click(googleButton);

    expect(assignMock).toHaveBeenCalledWith('http://localhost:3000/auth/google');
  });
});
