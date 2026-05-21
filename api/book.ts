import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { bookingData } = req.body || {};
  if (!bookingData) {
    return res.status(400).json({ success: false, error: 'bookingData is required' });
  }

  try {
    const {
      bookingNumber,
      customer = {},
      totalGuests,
      reservationFee,
      mainTour,
      additionalTours = [],
      totalPrice,
      flightDetails,
      accommodation,
      searchParams,
      guestList = [],
    } = bookingData;

    if (supabase) {
      try {
        const numericBookingId = parseInt((bookingNumber || '').split('-')[1] || '0', 10) || Date.now();
        console.log('Attempting to save to Supabase:', { booking_id: numericBookingId, reservation_fee: reservationFee ?? 0 });
        const { data, error } = await supabase.from('sales_report').insert([{ booking_id: numericBookingId, reservation_fee: reservationFee ?? 0, created_at: new Date().toISOString() }]);
        if (error) {
          console.error('Supabase insert error:', error);
        } else {
          console.log('Supabase insert success:', data);
        }
      } catch (err) {
        console.warn('Supabase save failed:', err);
      }
    } else {
      console.warn('Supabase client not initialized - check env vars');
    }

    // Do not fail if email credentials are absent; just return success.
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    if (!smtpUser || !smtpPass) {
      console.warn('SMTP credentials not provided in Vercel env; skipping email send.');
      return res.status(200).json({ success: true, bookingNumber, warning: 'SMTP credentials missing - email not sent' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    try {
      await transporter.verify();
    } catch (err) {
      console.error('SMTP verification failed on Vercel:', err);
      return res.status(502).json({ success: false, error: 'SMTP verification failed: ' + (err instanceof Error ? err.message : String(err)) });
    }

    // Full original PDF attachment generation (same format as server.ts)
    const generateVoucher = async () => {
      return new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({
          layout: 'landscape',
          size: 'A4',
          margin: 40,
        });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          try {
            resolve(Buffer.concat(chunks));
          } catch (err) {
            reject(err);
          }
        });
        doc.on('error', (err) => reject(err));

        const pageWidth = doc.page.width;
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;

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
        doc.font('Helvetica-Bold').text(`Contact No.: `, pageWidth / 2 + 40, infoY + 10, { continued: true }).font('Helvetica').text(`${customer.contact || 'N/A'}`);

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

        doc.font('Helvetica-Bold').text(`${customer.name || 'Guest'}`, margin, passY + 25, { width: 180, align: 'center' });
        doc.font('Helvetica').fontSize(8).text('(LEAD GUEST)', margin, passY + 33, { width: 180, align: 'center' });
        doc.font('Helvetica').fontSize(10).text(`${totalGuests || 1}`, margin + 180, passY + 25, { width: 190, align: 'center' });

        const flightInfo = flightDetails || 'N/A';
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

        doc.font('Helvetica').fontSize(9);
        const mainTourPrice = (bookingData.mainTourPrice || 0);
        doc.text(`${searchParams?.checkIn || 'TBA'}`, margin, currentY + 3, { width: colWidths[0], align: 'center' });
        doc.text(`${mainTour}`, margin + colWidths[0], currentY + 3, { width: colWidths[1], align: 'center' });
        doc.text(`${mainTourPrice.toLocaleString()}`, margin + colWidths[0] + colWidths[1], currentY + 3, { width: colWidths[2], align: 'center' });
        doc.text(`${totalGuests || 1}`, margin + colWidths[0] + colWidths[1] + colWidths[2], currentY + 3, { width: colWidths[3], align: 'center' });
        doc.text(`${(mainTourPrice * (totalGuests || 1)).toLocaleString()}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY + 3, { width: colWidths[4], align: 'center' });
        doc.rect(margin, currentY, contentWidth, rowHeight).stroke();
        currentY += rowHeight;

        additionalTours.forEach((t: any) => {
          doc.text(`${t.date || 'TBA'}`, margin, currentY + 3, { width: colWidths[0], align: 'center' });
          doc.text(`${t.name}`, margin + colWidths[0], currentY + 3, { width: colWidths[1], align: 'center' });
          doc.text(`${(t.price || 0).toLocaleString()}`, margin + colWidths[0] + colWidths[1], currentY + 3, { width: colWidths[2], align: 'center' });
          doc.text(`${totalGuests || 1}`, margin + colWidths[0] + colWidths[1] + colWidths[2], currentY + 3, { width: colWidths[3], align: 'center' });
          doc.text(`${((t.price || 0) * (totalGuests || 1)).toLocaleString()}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY + 3, { width: colWidths[4], align: 'center' });
          doc.rect(margin, currentY, contentWidth, rowHeight).stroke();
          currentY += rowHeight;
        });

        let vLineX = margin;
        colWidths.forEach((width, i) => {
          if (i < colWidths.length - 1) {
            doc.moveTo(vLineX + width, tableY).lineTo(vLineX + width, currentY).stroke();
          }
          vLineX += width;
        });

        const summaryWidth = colWidths[2] + colWidths[3] + colWidths[4];
        const summaryX = margin + colWidths[0] + colWidths[1];

        const numberOfTours = 1 + (additionalTours?.length || 0);
        const calculatedReservationFee = 400 * (totalGuests || 1) * numberOfTours;
        const calculatedBalance = (totalPrice || 0) - calculatedReservationFee;

        doc.font('Helvetica-Bold');
        doc.text('Total', summaryX, currentY + 3, { width: colWidths[2] + colWidths[3], align: 'center' });
        doc.text(`${(totalPrice || 0).toLocaleString()}`, summaryX + colWidths[2] + colWidths[3], currentY + 3, { width: colWidths[4], align: 'center' });
        doc.rect(summaryX, currentY, summaryWidth, rowHeight).stroke();
        doc.moveTo(summaryX + colWidths[2] + colWidths[3], currentY).lineTo(summaryX + colWidths[2] + colWidths[3], currentY + rowHeight).stroke();
        currentY += rowHeight;

        doc.text('Reservation', summaryX, currentY + 3, { width: colWidths[2] + colWidths[3], align: 'center' });
        doc.text(`${calculatedReservationFee.toLocaleString()}`, summaryX + colWidths[2] + colWidths[3], currentY + 3, { width: colWidths[4], align: 'center' });
        doc.rect(summaryX, currentY, summaryWidth, rowHeight).stroke();
        doc.moveTo(summaryX + colWidths[2] + colWidths[3], currentY).lineTo(summaryX + colWidths[2] + colWidths[3], currentY + rowHeight).stroke();
        currentY += rowHeight;

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
          <p>Hello <strong>${customer.name || 'Guest'}</strong>,</p>
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
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${searchParams?.checkIn || 'TBA'} to ${searchParams?.checkOut || 'TBA'}</td>
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
                ${additionalTours.map((t: any) => `<div>${t.name} (${t.date || 'TBA'})</div>`).join('')}
              </td>
            </tr>
            ` : ''}
            <tr style="border-top: 2px solid #eee;">
              <td style="padding: 20px 0; font-weight: bold; font-size: 20px; color: #111827;">Total Amount:</td>
              <td style="padding: 20px 0; text-align: right; font-weight: 900; font-size: 24px; color: #174B69;">₱${totalPrice?.toLocaleString() || '0'}</td>
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
      from: `Jcalbert Travel and Tour Services <${process.env.SMTP_USER}>`,
      to: bookingToEmails,
      bcc: bookingBccEmails,
      subject: `Booking confirmation: ${bookingNumber}`,
      html: emailHtml,
      attachments: [{ filename: `Voucher-${bookingNumber}.pdf`, content: pdfBuffer }],
    });

    return res.status(200).json({ success: true, bookingNumber });
  } catch (error) {
    console.error('API /api/book error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Server error' });
  }
}
