const { sendEmail } = require('../utils/mailer');

/**
 * Service to handle asynchronous email notifications
 */
const emailService = {
  /**
   * Send event registration confirmation email
   * @param {Object} user - User information { name, email }
   * @param {Object} event - Event details { title, date, time, location, description }
   * @returns {Promise<Object>}
   */
  async sendRegistrationConfirmation(user, event) {
    const subject = `Registration Confirmed: ${event.title}`;
    
    const textContent = `
Hello ${user.name},

You have successfully registered for the following virtual event:

Event: ${event.title}
Date: ${event.date}
Time: ${event.time}
Location/Link: ${event.location}
Description: ${event.description || 'No description provided.'}

Thank you for registering!

Best regards,
Virtual Event Management Team
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; max-width: 550px; background: #fafafa; }
    .header { font-size: 20px; font-weight: bold; color: #2b6cb0; margin-bottom: 12px; }
    .detail { margin: 8px 0; }
    .label { font-weight: bold; color: #4a5568; }
    .link-button { display: inline-block; background-color: #3182ce; color: #ffffff !important; padding: 10px 16px; border-radius: 6px; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">Event Registration Confirmed!</div>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>You have successfully registered for <strong>${event.title}</strong>.</p>
    
    <div class="detail"><span class="label">Date:</span> ${event.date}</div>
    <div class="detail"><span class="label">Time:</span> ${event.time}</div>
    <div class="detail"><span class="label">Platform / Link:</span> <a href="${event.location}">${event.location}</a></div>
    ${event.description ? `<div class="detail"><span class="label">Description:</span> ${event.description}</div>` : ''}

    <p style="margin-top: 20px;">We look forward to seeing you there!</p>
    <p style="color: #718096; font-size: 13px;">Virtual Event Management Platform</p>
  </div>
</body>
</html>
`.trim();

    return await sendEmail({
      to: user.email,
      subject,
      text: textContent,
      html: htmlContent
    });
  }
};

module.exports = emailService;
