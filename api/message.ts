import { addMessage } from './_lib/firestore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
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

  try {
    await addMessage({
      customer_booking_id: bookingIdInput || null,
      full_name: fullName,
      contact_email: contactEmail,
      message,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API /api/message Firestore error:', error);
    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'We could not send your message right now. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Server error',
    });
  }
}
