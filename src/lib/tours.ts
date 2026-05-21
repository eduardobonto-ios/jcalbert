import { Tour, Destination } from '../types';

interface TourRow {
  id: string;
  name: string;
  location: Destination;
  description: string;
  price: number | string;
  original_price?: number | string | null;
  is_best_seller?: boolean | null;
}

interface TourImageRow {
  tour_id: string;
  image_url: string;
  label: string;
  sort_order?: number | null;
}

interface TourHighlightRow {
  tour_id: string;
  highlight: string;
  sort_order?: number | null;
}

interface TourActivityRow {
  tour_id: string;
  activity: string;
  sort_order?: number | null;
}

export interface ToursQueryResult {
  tours: TourRow[];
  images: TourImageRow[];
  highlights: TourHighlightRow[];
  activities: TourActivityRow[];
}

const sortByOrder = <T extends { sort_order?: number | null }>(items: T[]) =>
  [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

export const sortTours = (tours: Tour[]) =>
  [...tours].sort((a, b) => {
    const aValue = Number.parseInt(a.id.replace(/\D/g, ''), 10);
    const bValue = Number.parseInt(b.id.replace(/\D/g, ''), 10);

    if (Number.isNaN(aValue) || Number.isNaN(bValue)) {
      return a.id.localeCompare(b.id);
    }

    return aValue - bValue;
  });

export const mapToursQueryResult = ({ tours, images, highlights, activities }: ToursQueryResult): Tour[] => {
  const imagesByTourId = new Map<string, TourImageRow[]>();
  const highlightsByTourId = new Map<string, TourHighlightRow[]>();
  const activitiesByTourId = new Map<string, TourActivityRow[]>();

  for (const image of images) {
    const existing = imagesByTourId.get(image.tour_id) ?? [];
    existing.push(image);
    imagesByTourId.set(image.tour_id, existing);
  }

  for (const highlight of highlights) {
    const existing = highlightsByTourId.get(highlight.tour_id) ?? [];
    existing.push(highlight);
    highlightsByTourId.set(highlight.tour_id, existing);
  }

  for (const activity of activities) {
    const existing = activitiesByTourId.get(activity.tour_id) ?? [];
    existing.push(activity);
    activitiesByTourId.set(activity.tour_id, existing);
  }

  return sortTours(
    tours.map((tourRow) => {
      const orderedImages = sortByOrder(imagesByTourId.get(tourRow.id) ?? []);
      const orderedHighlights = sortByOrder(highlightsByTourId.get(tourRow.id) ?? []);
      const orderedActivities = sortByOrder(activitiesByTourId.get(tourRow.id) ?? []);

      return {
        id: tourRow.id,
        name: tourRow.name,
        location: tourRow.location,
        description: tourRow.description,
        price: Number(tourRow.price),
        originalPrice: tourRow.original_price == null ? undefined : Number(tourRow.original_price),
        image: orderedImages[0]?.image_url,
        images: orderedImages.map((image) => ({
          url: image.image_url,
          label: image.label,
        })),
        highlights: orderedHighlights.map((highlight) => highlight.highlight),
        activities: orderedActivities.length ? orderedActivities.map((activity) => activity.activity) : undefined,
        isBestSeller: Boolean(tourRow.is_best_seller),
      };
    })
  );
};
