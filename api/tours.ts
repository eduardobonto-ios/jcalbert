import { getTours, PUBLIC_CACHE_HEADER } from './_lib/firestore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const tours = await getTours();
    res.setHeader('Cache-Control', PUBLIC_CACHE_HEADER);
    return res.status(200).json({ success: true, tours });
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
