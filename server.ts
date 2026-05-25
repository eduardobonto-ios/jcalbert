import express from 'express';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read env vars AFTER dotenv.config() so .env values are loaded.
// supabaseConfig.ts constants are evaluated at import-time (before dotenv runs),
// so we read process.env directly here to pick up the service role key.
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://qaepuswhpptcasriieps.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZXB1c3docHB0Y2FzcmlpZXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTA5NTcsImV4cCI6MjA4OTEyNjk1N30.9CuuxupRvvdV7MOY5lCfy9UtdVJtZwxFqbxsGNPM54g',
  { db: { schema: 'jcalbert' } },
);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3001);
  const HMR_PORT = Number(process.env.HMR_PORT || 24679);

  app.use(cors());
  app.use(express.json());

  app.post('/api/message', async (req, res) => {
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
      if (!supabase) {
        return res.status(500).json({
          success: false,
          error: 'Messaging is not configured on the server.',
        });
      }

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
        console.error('Supabase messaging insertion error:', error);
        return res.status(500).json({
          success: false,
          error:
            process.env.NODE_ENV === 'production'
              ? 'We could not send your message right now. Please try again.'
              : `Supabase error: ${error.message}`,
        });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Unexpected /api/message error:', error);
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
  });

  app.get('/api/tours', async (_req, res) => {
    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Supabase is not configured.' });
    }

    try {
      const [toursResult, imagesResult, highlightsResult, activitiesResult] = await Promise.all([
        supabase
          .from('tours')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('tour_images')
          .select('tour_id, tours_images_2, label, sort_order')
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

      return res.json({
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
  });

  app.get('/api/reviews', async (_req, res) => {
    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Supabase is not configured.' });
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, reviews_photo')
        .not('reviews_photo', 'is', null);

      console.log('Reviews count:', data?.length);
      console.log('Reviews error:', error);

      if (error) {
        console.error('Supabase reviews query error:', error);
        return res.status(500).json({
          success: false,
          error: process.env.NODE_ENV === 'production'
            ? 'We could not load reviews right now. Please try again.'
            : error.message,
        });
      }

      const reviews = (data ?? []).filter((row: { id: number; reviews_photo: string }) => row.reviews_photo);

      return res.json({ success: true, reviews });
    } catch (error) {
      console.error('Unexpected /api/reviews error:', error);
      return res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
          ? 'We could not load reviews right now. Please try again.'
          : error instanceof Error ? error.message : 'Server error',
      });
    }
  });

  app.get('/api/locations', async (_req, res) => {
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

      return res.json({
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
  });

  // API Route for Booking
  app.post('/api/book', async (req, res) => {
    const { bookingData } = req.body || {};
    if (!bookingData) {
      return res.status(400).json({ success: false, error: 'bookingData is required' });
    }
    const {
      bookingNumber,
      mainTour,
      additionalTours = [],
      customer = {},
      guestList = [],
      totalGuests,
      accommodation,
      flightDetails,
      searchParams,
      totalPrice,
      reservationFee
    } = bookingData;

    try {
      // Send to Supabase
      if (supabase) {
        // Extract the numeric part from 'JCA-12345678'
        const numericBookingId = parseInt((bookingNumber || '').split('-')[1] || '0', 10) || Date.now();
        
        const { data, error: supabaseError } = await supabase
          .from('sales_report')
          .insert([
            {
              booking_id: numericBookingId,
              reservation_fee: reservationFee,
              total_amount: totalPrice,
              created_at: new Date().toISOString()
            }
          ]);

        console.log('data:', data);
        console.log('error:', supabaseError);
        
        if (supabaseError) {
          console.error('Supabase insertion error:', supabaseError);
        } else {
          console.log('Successfully recorded reservation fee in Supabase');
        }
      }

      console.log('Attempting to send email to:', customer.email);

      // Validate SMTP credentials before attempting to send.
      const smtpUser = process.env.SMTP_USER?.trim();
      const smtpPass = process.env.SMTP_PASS?.trim();
      const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
      const smtpSecure = (process.env.SMTP_SECURE === 'true' || smtpPort === 465);

      if (!smtpUser || !smtpPass) {
        console.warn('SMTP credentials are missing. Email will not be sent.', { smtpHost, smtpPort, smtpSecure });
        return res.json({ success: true, bookingNumber, warning: 'SMTP_USER or SMTP_PASS is missing, email was skipped' });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
      });

      // Verify SMTP connection before sending a mail.
      try {
        await transporter.verify();
      } catch (err) {
        console.error('SMTP verification failed:', err);
        return res.status(502).json({ success: false, error: 'SMTP verification failed: ' + (err instanceof Error ? err.message : String(err)) });
      }

      // Generate PDF Voucher
      const generateVoucher = (): Promise<Buffer> => {
        return new Promise((resolve) => {
          const doc = new PDFDocument({ 
            layout: 'landscape', 
            size: 'A4',
            margin: 40 
          });
          const chunks: Buffer[] = [];

          doc.on('data', (chunk) => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));

          const pageWidth = doc.page.width;
          const margin = 40;
          const contentWidth = pageWidth - (margin * 2);

          // Header
          doc.font('Helvetica-Bold').fontSize(20).fillColor('#174B69').text('JCALBERT TRAVEL AND TOUR SERVICES', { align: 'center' });
          doc.font('Helvetica-Oblique').fontSize(12).fillColor('#1F91C7').text('Travel and Tour Services', { align: 'center' });
          doc.font('Helvetica').fontSize(10).fillColor('#888').text(`Contact No: 09121476827 / 09776654648`, { align: 'center' });
          doc.moveDown(0.5);
          doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).strokeColor('#000').lineWidth(1).stroke();
          doc.moveDown(1);

          doc.font('Helvetica-Bold').fontSize(16).fillColor('#000').text('CONFIRMATION VOUCHER', { align: 'center' });
          doc.moveDown(1);

          // Info Table (Top)
          const infoY = doc.y;
          doc.lineWidth(0.5).strokeColor('#000');
          doc.rect(margin, infoY, contentWidth, 40).stroke();
          doc.moveTo(pageWidth / 2 + 30, infoY).lineTo(pageWidth / 2 + 30, infoY + 40).stroke();
          doc.moveTo(margin, infoY + 20).lineTo(pageWidth / 2 + 30, infoY + 20).stroke();

          doc.font('Helvetica-Bold').fontSize(10);
          doc.text(`DATE: `, margin + 10, infoY + 5, { continued: true }).font('Helvetica').text(`${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
          doc.font('Helvetica-Bold').text(`PACKAGE: `, margin + 10, infoY + 25, { continued: true }).font('Helvetica').text(`${mainTour}`);
          doc.font('Helvetica-Bold').text(`Contact No.: `, pageWidth / 2 + 40, infoY + 10, { continued: true }).font('Helvetica').text(`${customer.contact}`);

          doc.moveDown(2);

          // Passenger Table
          const passY = doc.y;
          doc.rect(margin, passY, contentWidth, 40).stroke();
          doc.moveTo(margin + 180, passY).lineTo(margin + 180, passY + 40).stroke();
          doc.moveTo(margin + 370, passY).lineTo(margin + 370, passY + 40).stroke();
          doc.moveTo(margin, passY + 20).lineTo(pageWidth - margin, passY + 20).stroke();

          doc.font('Helvetica-Bold').fontSize(10);
          doc.text('PASSENGER NAMES:', margin, passY + 5, { width: 180, align: 'center' });
          doc.text('NO. OF GUEST', margin + 180, passY + 5, { width: 190, align: 'center' });
          doc.text('FLIGHT DETAILS:', margin + 370, passY + 5, { width: contentWidth - 370, align: 'center' });

          doc.font('Helvetica-Bold').text(`${customer.name}`, margin, passY + 25, { width: 180, align: 'center' });
          doc.font('Helvetica').fontSize(8).text('(LEAD GUEST)', margin, passY + 33, { width: 180, align: 'center' });
          
          doc.font('Helvetica').fontSize(10).text(`${totalGuests}`, margin + 180, passY + 25, { width: 190, align: 'center' });
          
          const flightInfo = flightDetails === 'N/A' ? 'N/A' : flightDetails;
          doc.fontSize(9).text(`${flightInfo}`, margin + 375, passY + 25, { width: contentWidth - 380 });

          doc.moveDown(2);

          // Tour Details Table
          const tableY = doc.y;
          const colWidths = [120, 300, 100, 100, contentWidth - (120 + 300 + 100 + 100)];
          const tableHeaders = ['TOUR DATE:', 'TOUR DESCRIPTION', 'AMOUNT PER PAX', 'NO. OF PAX', 'TOTAL'];
          
          doc.rect(margin, tableY, contentWidth, 20).stroke();
          let currentX = margin;
          tableHeaders.forEach((header, i) => {
            doc.font('Helvetica-Bold').fontSize(9).text(header, currentX, tableY + 5, { width: colWidths[i], align: 'center' });
            currentX += colWidths[i];
          });

          let currentY = tableY + 20;
          const rowHeight = 15;
          
          // Main Tour Row
          doc.font('Helvetica').fontSize(9);
          doc.text(`${searchParams?.checkIn || 'TBA'}`, margin, currentY + 3, { width: colWidths[0], align: 'center' });
          doc.text(`${mainTour}`, margin + colWidths[0], currentY + 3, { width: colWidths[1], align: 'center' });
          doc.text(`${(bookingData.mainTourPrice || 0).toLocaleString()}`, margin + colWidths[0] + colWidths[1], currentY + 3, { width: colWidths[2], align: 'center' });
          doc.text(`${totalGuests}`, margin + colWidths[0] + colWidths[1] + colWidths[2], currentY + 3, { width: colWidths[3], align: 'center' });
          doc.text(`${((bookingData.mainTourPrice || 0) * totalGuests).toLocaleString()}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY + 3, { width: colWidths[4], align: 'center' });
          doc.rect(margin, currentY, contentWidth, rowHeight).stroke();
          currentY += rowHeight;

          // Additional Tours Rows
          additionalTours.forEach((t: any) => {
            doc.text(`${t.date || 'TBA'}`, margin, currentY + 3, { width: colWidths[0], align: 'center' });
            doc.text(`${t.name}`, margin + colWidths[0], currentY + 3, { width: colWidths[1], align: 'center' });
            doc.text(`${t.price.toLocaleString()}`, margin + colWidths[0] + colWidths[1], currentY + 3, { width: colWidths[2], align: 'center' });
            doc.text(`${totalGuests}`, margin + colWidths[0] + colWidths[1] + colWidths[2], currentY + 3, { width: colWidths[3], align: 'center' });
            doc.text(`${(t.price * totalGuests).toLocaleString()}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY + 3, { width: colWidths[4], align: 'center' });
            doc.rect(margin, currentY, contentWidth, rowHeight).stroke();
            currentY += rowHeight;
          });

          // Empty rows to match format
          // Removed empty rows to save space

          // Draw vertical lines for the table
          let vLineX = margin;
          colWidths.forEach((width, i) => {
            if (i < colWidths.length - 1) {
              doc.moveTo(vLineX + width, tableY).lineTo(vLineX + width, currentY).stroke();
            }
            vLineX += width;
          });

          // Summary Rows
          const summaryWidth = colWidths[2] + colWidths[3] + colWidths[4];
          const summaryX = margin + colWidths[0] + colWidths[1];
          
          // New calculation for reservation fee: 400 per guest per tour package
          const numberOfTours = 1 + additionalTours.length;
          const calculatedReservationFee = 400 * totalGuests * numberOfTours;
          const calculatedBalance = totalPrice - calculatedReservationFee;

          doc.font('Helvetica-Bold');
          // Total
          doc.text('Total', summaryX, currentY + 3, { width: colWidths[2] + colWidths[3], align: 'center' });
          doc.text(`${totalPrice.toLocaleString()}`, summaryX + colWidths[2] + colWidths[3], currentY + 3, { width: colWidths[4], align: 'center' });
          doc.rect(summaryX, currentY, summaryWidth, rowHeight).stroke();
          doc.moveTo(summaryX + colWidths[2] + colWidths[3], currentY).lineTo(summaryX + colWidths[2] + colWidths[3], currentY + rowHeight).stroke();
          currentY += rowHeight;
          
          // Reservation
          doc.text('Reservation', summaryX, currentY + 3, { width: colWidths[2] + colWidths[3], align: 'center' });
          doc.text(`${calculatedReservationFee.toLocaleString()}`, summaryX + colWidths[2] + colWidths[3], currentY + 3, { width: colWidths[4], align: 'center' });
          doc.rect(summaryX, currentY, summaryWidth, rowHeight).stroke();
          doc.moveTo(summaryX + colWidths[2] + colWidths[3], currentY).lineTo(summaryX + colWidths[2] + colWidths[3], currentY + rowHeight).stroke();
          currentY += rowHeight;
          
          // Balance
          doc.text('Balance', summaryX, currentY + 3, { width: colWidths[2] + colWidths[3], align: 'center' });
          doc.text(`${calculatedBalance.toLocaleString()}`, summaryX + colWidths[2] + colWidths[3], currentY + 3, { width: colWidths[4], align: 'center' });
          doc.rect(summaryX, currentY, summaryWidth, rowHeight).stroke();
          doc.moveTo(summaryX + colWidths[2] + colWidths[3], currentY).lineTo(summaryX + colWidths[2] + colWidths[3], currentY + rowHeight).stroke();
          currentY += rowHeight;

          doc.moveDown(1);

          // Pickup and Remarks
          const footerTableY = doc.y;
          doc.rect(margin, footerTableY, contentWidth, 40).stroke();
          doc.moveTo(margin + 160, footerTableY).lineTo(margin + 160, footerTableY + 40).stroke();
          doc.moveTo(margin, footerTableY + 20).lineTo(pageWidth - margin, footerTableY + 20).stroke();

          doc.font('Helvetica-Bold').text('PICK UP:', margin + 10, footerTableY + 5);
          doc.font('Helvetica').text(`${accommodation || 'TBA'}`, margin + 170, footerTableY + 5);
          
          doc.font('Helvetica-Bold').text('Remarks:', margin + 10, footerTableY + 25);
          doc.font('Helvetica').text('The remaining balance of ', margin + 170, footerTableY + 25, { continued: true });
          doc.font('Helvetica-Bold').fillColor('black').rect(margin + 295, footerTableY + 22, 70, 12).fill('#ffff00').stroke();
          doc.fillColor('black').text(`Php ${calculatedBalance.toLocaleString()}`, { continued: true });
          doc.font('Helvetica').text(' is to be collected upon pick up/arrival by tour guide.');

          doc.moveDown(1);

          // Notes
          doc.fillColor('red').font('Helvetica-Bold').fontSize(9).text('*NOTE:', margin);
          doc.fillColor('black').font('Helvetica').fontSize(8);
          doc.text('•  The reservation fee is NON-REFUNDABLE.', margin);
          doc.text('•  The reservation fee will be deducted from the total package price. Full payment will be collected upon arrival/pickup by tour guide.', margin);
          
          doc.moveDown(1);
          doc.font('Helvetica-Bold').text('TOUR ACTIVITIES CANCELLATION:', margin);
          doc.font('Helvetica').text('•  If cancellation is 1 week before the tour-                                         No Refund/ Forfeited', margin);
          doc.text('•  If cancellation is a month before the tour-                                        50% Refund', margin);

          doc.moveDown(1);
          doc.fillColor('red').font('Helvetica-Bold').text('*I will also give update/further instructions a day before your tour date.', margin);

          doc.end();
        });
      };

      const pdfBuffer = await generateVoucher();

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #1F91C7; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Booking Confirmed!</h1>
            <p style="margin: 5px 0 0;">Jcalbert Travel and Tour Services</p>
          </div>
          <div style="padding: 20px;">
            <p>Hello <strong>${customer.name}</strong>,</p>
            <p>Your booking has been successfully confirmed. Please find your <strong>Confirmation Voucher</strong> attached to this email.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Booking Reference Number</p>
              <p style="margin: 0; font-size: 28px; color: #2563eb; font-weight: 900; letter-spacing: 1px;">${bookingNumber}</p>
            </div>

            <h3 style="border-bottom: 2px solid #1F91C7; padding-bottom: 8px; color: #1f2937;">Other guest names (complete the form for permits)</h3>
            <ul style="margin: 10px 0; padding-left: 20px; color: #374151;">
              ${guestList.map((guest: { name: string; age: string }) => `<li>${guest.name} (Age: ${guest.age || 'N/A'})</li>`).join('')}
            </ul>

            <h3 style="border-bottom: 2px solid #1F91C7; padding-bottom: 8px; color: #1f2937;">Tour Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 40%;">Main Tour:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${mainTour}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Tour Dates:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${searchParams?.checkIn} to ${searchParams?.checkOut}</td>
              </tr>
              ${accommodation ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Accommodation:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${accommodation}</td>
              </tr>
              ` : ''}
              ${flightDetails ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Flight Details:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${flightDetails}</td>
              </tr>
              ` : ''}
              ${additionalTours.length > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Additional Tours:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2563eb;">
                  ${additionalTours.map((t: any) => `<div>${t.name} (${t.date})</div>`).join('')}
                </td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #eee;">
                <td style="padding: 20px 0; font-weight: bold; font-size: 20px; color: #111827;">Total Amount:</td>
                <td style="padding: 20px 0; text-align: right; font-weight: 900; font-size: 24px; color: #174B69;">₱${totalPrice.toLocaleString()}</td>
              </tr>
            </table>

            <div style="margin-top: 30px; padding: 20px; background-color: #E5F8FF; border-radius: 8px; border-left: 4px solid #1F91C7;">
              <p style="margin: 0; font-size: 14px; color: #174B69; line-height: 1.5;">
                <strong>Important Note:</strong> Please present your booking reference number and the attached voucher upon arrival.
              </p>
            </div>
          </div>
          <div style="background-color: #111827; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            © 2026 Jcalbert Travel and Tour Services. All rights reserved.
          </div>
        </div>
      `;

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials missing.');
        return res.json({ success: true, bookingNumber });
      }

      const bookingBccEmails = (process.env.BOOKING_BCC_EMAILS?.split(',') || [
        'eduardobonto@gmail.com',
        'ccmoviesandseries@gmail.com',
      ])
        .map((email) => email.trim())
        .filter(Boolean);
      const internalToEmails = (process.env.BOOKING_TO_EMAILS?.split(',') || [
        'jcalbert2024@gmail.com',
      ])
        .map((email) => email.trim())
        .filter(Boolean);
      const bookingToEmails = [customer.email, ...internalToEmails].filter(Boolean);

      await transporter.sendMail({
        from: `"Jcalbert Travel and Tour Services" <${process.env.SMTP_USER}>`,
        to: bookingToEmails,
        bcc: bookingBccEmails,
        subject: `Booking Confirmation - ${bookingNumber}`,
        html: emailHtml,
        attachments: [
          {
            filename: `Confirmation_Voucher_${bookingNumber}.pdf`,
            content: pdfBuffer,
          }
        ]
      });

      res.json({ success: true, bookingNumber });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send confirmation email' 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { port: HMR_PORT },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Run with a different port, for example: $env:PORT=3002; npm run dev`);
      process.exit(1);
    }

    throw error;
  });
}

startServer();
