import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// FIREBASE_SERVICE_ACCOUNT holds the full service-account JSON (set in Vercel env vars).
const getDb = () => {
  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set.');
    initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
    getFirestore().settings({ preferRest: true });
  }
  return getFirestore();
};

// Serve Cloudinary photos resized and in the lightest format each browser supports.
const optimizeImageUrl = (url: string) =>
  url.includes('res.cloudinary.com')
    ? url.replace('/image/upload/', '/image/upload/f_auto,q_auto,c_limit,w_1600/')
    : url;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const snapshot = await getDb().collection('tours').get();

    // Each tour document holds its images, highlights and activities; flatten them back
    // into the row lists the frontend (src/lib/tours.ts) already expects.
    const tours: Record<string, unknown>[] = [];
    const images: Record<string, unknown>[] = [];
    const highlights: Record<string, unknown>[] = [];
    const activities: Record<string, unknown>[] = [];

    for (const doc of snapshot.docs) {
      const {
        images: tourImages = [],
        highlights: tourHighlights = [],
        activities: tourActivities = [],
        ...tour
      } = doc.data();

      tours.push({ id: doc.id, ...tour });
      tourImages.forEach((image: { url: string; label?: string }, index: number) => {
        images.push({
          tour_id: doc.id,
          tours_images_2: optimizeImageUrl(image.url),
          label: image.label ?? '',
          sort_order: index + 1,
        });
      });
      tourHighlights.forEach((highlight: string, index: number) => {
        highlights.push({ tour_id: doc.id, highlight, sort_order: index + 1 });
      });
      tourActivities.forEach((activity: string, index: number) => {
        activities.push({ tour_id: doc.id, activity, sort_order: index + 1 });
      });
    }

    // Let Vercel's CDN answer repeat visits for 5 minutes so most page loads never reach Firestore.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    return res.status(200).json({ success: true, tours, images, highlights, activities });
  } catch (error) {
    console.error('Unexpected /api/tours error:', error);
    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'We could not load tours right now. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Server error',
    });
  }
}
