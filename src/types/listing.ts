export interface Listing {
  id: string;
  title: string;
  description: string;
  viewCount?: number;
  createdAt: string;
}

export type ListingDetail = Listing;
