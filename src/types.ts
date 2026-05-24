export type Destination = string;
export type DestinationOrEmpty = Destination | '';

export interface Tour {
  id: string;
  name: string;
  location: Destination;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: (string | { url: string; label: string })[];
  highlights: string[];
  activities?: string[];
  isBestSeller?: boolean;
}

export interface Review {
  id: string;
  userName: string;
  userImage: string;
  rating: number;
  comment: string;
  date: string;
  tourName: string;
}

export interface SearchParams {
  destination: DestinationOrEmpty;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}
