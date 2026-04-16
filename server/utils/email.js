/**
 * Email Utility
 * 
 * Sends email notifications for booking confirmations and cancellations.
 * 
 * In development: Uses Nodemailer's Ethereal service (fake SMTP) so you
 * can test emails without real credentials. Ethereal captures the emails
 * and provides a URL to view them.
 * 
 * In production: Configure real SMTP credentials via environment variables.
 * 
 * Alternative considered: SendGrid API — rejected because Nodemailer + 
 * Ethereal requires no external account setup and keeps things simple.
 */

const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize email transporter
 * Uses Ethereal (fake SMTP) if no real SMTP credentials are configured
 */
async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Use real SMTP if configured
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Use Ethereal fake SMTP for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('📧 Using Ethereal email (dev mode). View sent emails at https://ethereal.email');
  }

  return transporter;
}

/**
 * Send booking confirmation email
 */
async function sendBookingConfirmation(meeting, eventType) {
  try {
    const transport = await getTransporter();
    const startTime = new Date(meeting.start_time);
    
    const info = await transport.sendMail({
      from: `"${eventType.userName || 'Calendly Clone'}" <noreply@calendly-clone.com>`,
      to: meeting.invitee_email,
      subject: `Meeting Confirmed: ${eventType.name}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0069ff; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Meeting Confirmed! ✅</h1>
          </div>
          <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a1a2e; margin-top: 0;">${eventType.name}</h2>
            <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 8px 0; color: #666;">
                <strong>📅 Date:</strong> ${startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p style="margin: 8px 0; color: #666;">
                <strong>🕐 Time:</strong> ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p style="margin: 8px 0; color: #666;">
                <strong>⏱️ Duration:</strong> ${eventType.duration} minutes
              </p>
              <p style="margin: 8px 0; color: #666;">
                <strong>👤 Invitee:</strong> ${meeting.invitee_name}
              </p>
            </div>
            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 24px;">
              This is an automated email from Calendly Clone.
            </p>
          </div>
        </div>
      `
    });

    // In dev mode, log the Ethereal URL to view the email
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview email at:', previewUrl);
    }

    return { success: true, previewUrl };
  } catch (error) {
    console.error('Email error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send cancellation email
 */
async function sendCancellationEmail(meeting, eventType) {
  try {
    const transport = await getTransporter();
    const startTime = new Date(meeting.start_time);

    const info = await transport.sendMail({
      from: `"${eventType.userName || 'Calendly Clone'}" <noreply@calendly-clone.com>`,
      to: meeting.invitee_email,
      subject: `Meeting Cancelled: ${eventType.name}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc3545; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Meeting Cancelled ❌</h1>
          </div>
          <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a1a2e; margin-top: 0;">${eventType.name}</h2>
            <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 8px 0; color: #666;">
                <strong>📅 Date:</strong> ${startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p style="margin: 8px 0; color: #666;">
                <strong>🕐 Time:</strong> ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              ${meeting.cancel_reason ? `
              <p style="margin: 8px 0; color: #666;">
                <strong>📝 Reason:</strong> ${meeting.cancel_reason}
              </p>` : ''}
            </div>
          </div>
        </div>
      `
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview cancellation email at:', previewUrl);
    }

    return { success: true, previewUrl };
  } catch (error) {
    console.error('Email error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendBookingConfirmation, sendCancellationEmail };
