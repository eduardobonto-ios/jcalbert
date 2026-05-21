import { Tour } from './types';
import { getApiUrl } from './lib/api';
import { mapToursQueryResult } from './lib/tours';

export async function fetchTours(): Promise<Tour[]> {
  const response = await fetch(getApiUrl('/api/tours'));

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Tours API request failed (${response.status}): ${
        errorText ? errorText.replace(/\s+/g, ' ').trim() : response.statusText
      }`
    );
  }

  const payload = await response.json();

  if (!payload || !Array.isArray(payload.tours)) {
    throw new Error('Invalid tours payload received from API.');
  }

  return mapToursQueryResult({
    tours: payload.tours,
    images: Array.isArray(payload.images) ? payload.images : [],
    highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
    activities: Array.isArray(payload.activities) ? payload.activities : [],
  });
}
