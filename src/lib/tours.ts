import { Tour, Destination } from '../types';

// Shape of a Firestore "tours" document as returned by /api/tours.
// Images, highlights and activities are embedded, already in display order.
export interface TourDoc {
  id: string;
  name: string;
  location: Destination;
  description: string;
  price: number | string;
  original_price?: number | string | null;
  is_best_seller?: boolean | null;
  images?: { url?: string | null; label?: string | null }[];
  highlights?: string[];
  activities?: string[];
}

export const sortTours = (tours: Tour[]) =>
  [...tours].sort((a, b) => {
    const aValue = Number.parseInt(a.id.replace(/\D/g, ''), 10);
    const bValue = Number.parseInt(b.id.replace(/\D/g, ''), 10);

    if (Number.isNaN(aValue) || Number.isNaN(bValue)) {
      return a.id.localeCompare(b.id);
    }

    return aValue - bValue;
  });

export const mapTourDocs = (tourDocs: TourDoc[]): Tour[] =>
  sortTours(
    tourDocs.map((tourDoc) => {
      const images = (tourDoc.images ?? []).filter(
        (image): image is { url: string; label?: string | null } =>
          typeof image.url === 'string' && image.url.trim().length > 0
      );
      const activities = tourDoc.activities ?? [];

      return {
        id: String(tourDoc.id),
        name: tourDoc.name,
        location: tourDoc.location,
        description: tourDoc.description,
        price: Number(tourDoc.price),
        originalPrice: tourDoc.original_price == null ? undefined : Number(tourDoc.original_price),
        image: images[0]?.url,
        images: images.map((image) => ({ url: image.url, label: image.label ?? tourDoc.name })),
        highlights: tourDoc.highlights ?? [],
        activities: activities.length ? activities : undefined,
        isBestSeller: Boolean(tourDoc.is_best_seller),
      };
    })
  );
