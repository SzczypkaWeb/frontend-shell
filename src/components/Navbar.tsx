import { Button } from '@szczypkaweb/shared-ui';
import { useAuthStore } from '../store/authStore';

// Selecting narrow slices (rather than the whole store) keeps Navbar from
// re-rendering on unrelated authStore changes, e.g. isLoading toggles.
export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {user ? (
        <>
          <span>{user.email}</span>
          <Button variant="secondary" size="small" onClick={() => logout()}>
            Logout
          </Button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </nav>
  );
}
