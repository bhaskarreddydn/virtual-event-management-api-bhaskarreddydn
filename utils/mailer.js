const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Creates or retrieves the Nodemailer transporter based on environment configuration.
 * Supports:
 * 1. Custom SMTP / Brevo / SendGrid / Mailgun / Gmail
 * 2. Ethereal Email (Auto-generated zero-config test mailbox for local dev & testing)
 */
async function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // If explicit SMTP credentials are provided
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return cachedTransporter;
  }

  // In test environment, use a mock transporter to avoid network delays
  if (process.env.NODE_ENV === 'test') {
    cachedTransporter = {
      sendMail: async (mailOptions) => {
        return {
          messageId: `test-msg-${Date.now()}`,
          response: '250 Test message accepted',
          envelope: { from: mailOptions.from, to: mailOptions.to },
          previewUrl: 'https://ethereal.email/message/test-preview'
        };
      }
    };
    return cachedTransporter;
  }

  // Default fallback: create an ephemeral Ethereal test account (zero credentials required)
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('[Mailer] Ethereal test SMTP initialized. Previews will be logged to console.');
    return cachedTransporter;
  } catch (err) {
    console.warn('[Mailer] Could not create Ethereal account, falling back to mock logger:', err.message);
    cachedTransporter = {
      sendMail: async (mailOptions) => {
        console.log(`[Mailer Mock] Email to ${mailOptions.to} subject: "${mailOptions.subject}"`);
        return { messageId: `mock-msg-${Date.now()}` };
      }
    };
    return cachedTransporter;
  }
}

/**
 * Send an email asynchronously using Promise / async-await
 * @param {Object} options - { to, subject, text, html }
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"Virtual Event Platform" <noreply@virtualevent.local>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : info.previewUrl;
    if (previewUrl) {
      console.log(`[Mailer] Message preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null
    };
  } catch (error) {
    console.error('[Mailer Error] Failed to send email:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendEmail,
  getTransporter
};
