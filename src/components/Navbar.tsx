import { Button } from '@szczypkaweb/shared-ui';
import { useAuthStore } from '../store/authStore';

// Selecting narrow slices (rather than the whole store) keeps Navbar from
// re-rendering on unrelated authStore changes, e.g. isLoading toggles.
export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <nav className="flex items-center justify-end gap-3 border-b border-gray-200 px-4 py-3">
      {user ? (
        <>
          <span className="text-sm text-gray-700">{user.email}</span>
          <Button onClick={() => logout()} variant="secondary">
            Logout
          </Button>
        </>
      ) : (
        <Button
          onClick={() => {
            window.location.assign('/login');
          }}
          variant="ghost"
        >
          Login
        </Button>
      )}
    </nav>
  );
}
