import { useListing } from '../hooks/useListing';

interface ListingDetailProps {
  id: string;
}

export function ListingDetail({ id }: ListingDetailProps) {
  const { data, isLoading, error } = useListing(id);

  if (isLoading) return <p>Ładowanie...</p>;
  if (error) return <p>Błąd: {(error as Error).message}</p>;

  const viewCount = data?.viewCount ?? 0;
  const viewCountText = viewCount === 1 ? '1 view' : `${viewCount} views`;

  return (
    <div>
      <h1>{data?.title}</h1>
      <p>{data?.description}</p>
      <p style={{ color: '#666', fontSize: '0.875rem' }}>{viewCountText}</p>
    </div>
  );
}
