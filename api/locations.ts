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

  try {
    const { data, error } = await supabase
      .from('location')
      .select('location_name')
      .order('location_name', { ascending: true });

    console.log('data:', data);
    console.log('error:', error);

    if (error) {
      console.error('Supabase locations query error:', error);
      return res.status(500).json({
        success: false,
        error:
          process.env.NODE_ENV === 'production'
            ? 'We could not load destinations right now. Please try again.'
            : error.message,
      });
    }

    return res.status(200).json({
      success: true,
      locations: (data ?? []).map((location) => location.location_name).filter(Boolean),
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
