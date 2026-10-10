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
    ? url.replace('/image/upload/', '/image/upload/f_auto,q_auto,c_limit,w_1200/')
    : url;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const snapshot = await getDb().collection('reviews').orderBy('created_at').get();

    const reviews = snapshot.docs
      .filter((doc) => typeof doc.get('reviews_photo') === 'string' && doc.get('reviews_photo'))
      .map((doc) => ({ id: doc.id, reviews_photo: optimizeImageUrl(doc.get('reviews_photo')) }));

    // Let Vercel's CDN answer repeat visits for 5 minutes so most page loads never reach Firestore.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error('Unexpected /api/reviews error:', error);
    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'We could not load reviews right now. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Server error',
    });
  }
}
