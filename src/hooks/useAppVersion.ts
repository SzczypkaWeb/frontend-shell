import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/httpClient';

interface VersionResponse {
  version: string;
}

async function fetchAppVersion(): Promise<string | null> {
  try {
    const res = await apiFetch('/version');
    if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
    const data = (await res.json()) as VersionResponse;
    return data.version;
  } catch (err) {
    // The version display is a nice-to-have; never let it disrupt the shell.
    console.debug('Failed to fetch app version', err);
    return null;
  }
}

// Fetched once on initial load and cached for the lifetime of the app —
// the version never changes without a full page reload.
export function useAppVersion() {
  return useQuery({
    queryKey: ['app-version'],
    queryFn: fetchAppVersion,
    staleTime: Infinity,
    retry: false,
  });
}
