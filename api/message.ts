import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Messaging is not configured on the server.',
    });
  }

  const bookingIdInput = typeof req.body?.bookingId === 'string' ? req.body.bookingId.trim() : '';
  const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
  const contactEmail = typeof req.body?.contactEmail === 'string' ? req.body.contactEmail.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!fullName) {
    return res.status(400).json({ success: false, error: 'Full name is required.' });
  }

  if (!contactEmail) {
    return res.status(400).json({ success: false, error: 'Contact number or email is required.' });
  }

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required.' });
  }

  const bookingId = bookingIdInput || null;

  try {
    const { error } = await supabase.from('messaging').insert([
      {
        customer_booking_id: bookingId,
        full_name: fullName,
        contact_email: contactEmail,
        message,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('API /api/message Supabase error:', error);
      return res.status(500).json({
        success: false,
        error:
          process.env.NODE_ENV === 'production'
            ? 'We could not send your message right now. Please try again.'
            : `Supabase error: ${error.message}`,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API /api/message error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
}
