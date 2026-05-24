import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qaepuswhpptcasriieps.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZXB1c3docHB0Y2FzcmlpZXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTA5NTcsImV4cCI6MjA4OTEyNjk1N30.9CuuxupRvvdV7MOY5lCfy9UtdVJtZwxFqbxsGNPM54g';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
        .schema('jcalbert')
        .from('tours')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .schema('jcalbert')
        .from('tour_images')
        .select('tour_id, image_url, label, sort_order')
        .order('sort_order', { ascending: true }),
      supabase
        .schema('jcalbert')
        .from('tour_highlights')
        .select('tour_id, highlight, sort_order')
        .order('sort_order', { ascending: true }),
      supabase
        .schema('jcalbert')
        .from('tour_activities')
        .select('tour_id, activity, sort_order')
        .order('sort_order', { ascending: true }),
    ]);

    console.log('data:', toursResult.data);
    console.log('error:', toursResult.error);
    console.log('data:', imagesResult.data);
    console.log('error:', imagesResult.error);
    console.log('data:', highlightsResult.data);
    console.log('error:', highlightsResult.error);
    console.log('data:', activitiesResult.data);
    console.log('error:', activitiesResult.error);

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
