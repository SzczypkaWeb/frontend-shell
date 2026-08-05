import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/httpClient';
import { useAuthStore } from '../store/authStore';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

// GET /users is a protected endpoint. AppShell already guards against
// mounting this hook before checkAuth() confirms a session, but as
// defense-in-depth a 401 here (e.g. a session that expired mid-app) is
// handled by delegating to authStore.logout() instead of being treated as a
// generic query error - the caller (App.tsx) would otherwise render a raw
// "Błąd: ..." message to a user who simply isn't logged in anymore.
// Resolving to an empty list (rather than throwing) keeps `error` unset;
// authStore.logout() clearing the user then drives AppShell back to
// LoginScreen on its own.
async function fetchUsers(onUnauthorized: () => Promise<void>): Promise<User[]> {
  const res = await apiFetch('/users');
  if (res.status === 401) {
    await onUnauthorized();
    return [];
  }
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export function useUsers() {
  const logout = useAuthStore((state) => state.logout);

  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(logout),
  });
}
