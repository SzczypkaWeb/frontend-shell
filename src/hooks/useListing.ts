import { useQuery } from '@tanstack/react-query';
import { Listing } from '../types/listing';
import { API_BASE_URL } from '../api/config';

async function fetchListing(id: string): Promise<Listing> {
  const res = await fetch(`${API_BASE_URL}/listings/${id}`);
  if (!res.ok) throw new Error('Failed to fetch listing');
  return res.json();
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id),
  });
}
