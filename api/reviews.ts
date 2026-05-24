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

  const { data, error } = await supabase
    .schema('jcalbert')
    .from('reviews')
    .select('reviews_photo')
    .not('reviews_photo', 'is', null);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  const photos = (data ?? [])
    .map((row: { reviews_photo: string }) => row.reviews_photo)
    .filter(Boolean);

  return res.status(200).json({ photos });
}
