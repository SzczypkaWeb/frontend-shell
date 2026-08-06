import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/httpClient';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

// GET /users is a protected endpoint. AppShell already guards against
// mounting this hook before checkAuth() confirms a session, but as
// defense-in-depth a 401 here (e.g. a session that expired mid-app) must not
// surface as a generic query error - the caller (App.tsx) would otherwise
// render a raw "Błąd: ..." message to a user who simply isn't logged in
// anymore.
//
// Note this is only a fallback display concern, not a session-recovery one:
// apiFetch (see src/api/httpClient.ts) already centrally attempts a silent
// refresh-and-retry on any 401, and calls authStore.logout() itself if that
// refresh fails. So a 401 reaching here means the refresh already failed and
// logout was already triggered - this hook must NOT call logout() again
// (that would fire a second, redundant /auth/logout request). Resolving to
// an empty list (rather than throwing) just keeps `error` unset while
// authStore's already-cleared user drives AppShell back to LoginScreen.
async function fetchUsers(): Promise<User[]> {
  const res = await apiFetch('/users');
  if (res.status === 401) {
    return [];
  }
  if (!res.ok) throw new Error('Failed to fetch users');
  const json: { data: User[]; total: number } = await res.json();
  return json.data;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}
