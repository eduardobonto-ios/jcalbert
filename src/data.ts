import { Tour } from './types';
import { getApiUrl } from './lib/api';
import { mapTourDocs } from './lib/tours';

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

  return mapTourDocs(payload.tours);
}

export async function fetchLocations(): Promise<string[]> {
  try {
    const response = await fetch(getApiUrl('/api/locations'));

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Locations API request failed (${response.status}): ${
          errorText ? errorText.replace(/\s+/g, ' ').trim() : response.statusText
        }`
      );
    }

    const payload = await response.json();
    const locations = Array.isArray(payload?.locations)
      ? payload.locations.filter((location: unknown): location is string => typeof location === 'string' && location.trim().length > 0)
      : [];

    return locations;
  } catch (err) {
    console.error('fetchLocations failed:', err instanceof Error ? err.message : err);
    return [];
  }
}
