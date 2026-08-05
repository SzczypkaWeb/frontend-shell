import { Button } from '@szczypkaweb/shared-ui';
import { useAuthStore } from '../store/authStore';

// Selecting narrow slices (rather than the whole store) keeps Navbar from
// re-rendering on unrelated authStore changes, e.g. isLoading toggles.
export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <nav className="flex justify-end items-center gap-3 px-4 py-3 border-b border-gray-200">
      {user ? (
        <>
          <span className="text-sm text-gray-700">{user.email}</span>
          <Button variant="secondary" size="small" onClick={() => logout()}>
            Logout
          </Button>
        </>
      ) : (
        <a href="/login" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
          Login
        </a>
      )}
    </nav>
  );
}
