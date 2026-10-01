/**
 * Brevo (formerly Sendinblue) Transactional Email Client
 * Sends emails via Brevo REST API v3 (POST https://api.brevo.com/v3/smtp/email)
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Send an email using Brevo REST API v3
 * @param {Object} options - { to, subject, text, html }
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendEmail({ to, subject, text, html }) {
  // In test environment, mock sending to avoid network latency and external dependencies
  if (process.env.NODE_ENV === 'test') {
    return {
      success: true,
      messageId: `mock-brevo-${Date.now()}`
    };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    const errorMsg = 'BREVO_API_KEY is not defined in environment variables';
    console.error(`[Brevo Error] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const senderName = process.env.BREVO_SENDER_NAME || 'Virtual Event Platform';
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!senderEmail) {
    const errorMsg = 'BREVO_SENDER_EMAIL is not configured in .env (must be a verified Brevo sender)';
    console.error(`[Brevo Error] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [
      {
        email: to
      }
    ],
    subject: subject,
    htmlContent: html,
    textContent: text
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log(`[Brevo] Email successfully sent to ${to}. Message ID: ${data.messageId}`);
      return {
        success: true,
        messageId: data.messageId
      };
    }

    const errorMessage = data.message || `Brevo API HTTP ${response.status}: ${response.statusText}`;
    console.error(`[Brevo Error] Failed to send email: ${errorMessage}`, data);
    return {
      success: false,
      error: errorMessage
    };
  } catch (error) {
    console.error(`[Brevo Error] Network or unexpected failure:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendEmail
};
