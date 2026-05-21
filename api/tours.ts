import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase is not configured.' });
  }

  try {
    const [toursResult, imagesResult, highlightsResult, activitiesResult] = await Promise.all([
      supabase
        .from('tours')
        .select('id, name, location, description, price, original_price, is_best_seller'),
      supabase
        .from('tour_images')
        .select('tour_id, image_url, label, sort_order')
        .order('sort_order', { ascending: true }),
      supabase
        .from('tour_highlights')
        .select('tour_id, highlight, sort_order')
        .order('sort_order', { ascending: true }),
      supabase
        .from('tour_activities')
        .select('tour_id, activity, sort_order')
        .order('sort_order', { ascending: true }),
    ]);

    const error =
      toursResult.error ||
      imagesResult.error ||
      highlightsResult.error ||
      activitiesResult.error;

    if (error) {
      console.error('Supabase tours query error:', error);
      return res.status(500).json({
        success: false,
        error:
          process.env.NODE_ENV === 'production'
            ? 'We could not load tours right now. Please try again.'
            : error.message,
      });
    }

    return res.status(200).json({
      success: true,
      tours: toursResult.data ?? [],
      images: imagesResult.data ?? [],
      highlights: highlightsResult.data ?? [],
      activities: activitiesResult.data ?? [],
    });
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
