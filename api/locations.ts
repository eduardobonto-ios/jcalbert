import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from '../src/lib/supabaseConfig';

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase is not configured.' });
  }

  try {
    const { data, error } = await supabase
      .schema('jcalbert')
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
