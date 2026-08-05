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
          <button
            onClick={() => logout()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Logout
          </button>
        </>
      ) : (
        <a
          href="/login"
          className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          Login
        </a>
      )}
    </nav>
  );
}
