import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qaepuswhpptcasriieps.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZXB1c3docHB0Y2FzcmlpZXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTA5NTcsImV4cCI6MjA4OTEyNjk1N30.9CuuxupRvvdV7MOY5lCfy9UtdVJtZwxFqbxsGNPM54g';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'jcalbert' } });

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
    const { data, error } = await supabase
      .from('messaging')
      .insert([
        {
          customer_booking_id: bookingId,
          full_name: fullName,
          contact_email: contactEmail,
          message,
          created_at: new Date().toISOString(),
        },
      ]);

    console.log('data:', data);
    console.log('error:', error);

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
