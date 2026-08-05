import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// LoginScreen only talks to the backend through authStore.login(), so we mock
// the store and assert on how the component drives it - the actual network
// contract (POST /auth/login, credentials: include) is covered by
// src/api/auth.test.ts and src/store/authStore.test.ts.
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

async function setupLoginScreen(
  login: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue(undefined),
) {
  const { useAuthStore } = await import('../store/authStore');
  const state = { login, isLoading: false };
  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
  const { LoginScreen } = await import('./LoginScreen');
  return { ...render(<LoginScreen />), login };
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
});
