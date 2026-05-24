import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qaepuswhpptcasriieps.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZXB1c3docHB0Y2FzcmlpZXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTA5NTcsImV4cCI6MjA4OTEyNjk1N30.9CuuxupRvvdV7MOY5lCfy9UtdVJtZwxFqbxsGNPM54g';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'jcalbert' } });

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase is not configured.' });
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('reviews_photo, reviewer_name, rating, review_text, created_at')
    .not('reviews_photo', 'is', null)
    .order('created_at', { ascending: false });

  console.log('Reviews data:', data);
  console.log('Reviews error:', error);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  const reviews = (data ?? []).filter((row: any) => row.reviews_photo);

  return res.status(200).json({ success: true, reviews });
}
