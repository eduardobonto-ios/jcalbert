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

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const snapshot = await getDb().collection('location').orderBy('location_name').get();

    // Let Vercel's CDN answer repeat visits for 5 minutes so most page loads never reach Firestore.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    return res.status(200).json({
      success: true,
      locations: snapshot.docs.map((doc) => doc.get('location_name')).filter(Boolean),
    });
  } catch (error) {
    console.error('Unexpected /api/locations error:', error);
    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'We could not load destinations right now. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Server error',
    });
  }
}
