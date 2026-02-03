const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mailerSend = new MailerSend({
    apiKey: process.env.MAIL_KEY,
});


async function sendVerificationEmail(recipientEmail) {
    try {
      const sentFrom = new Sender("info@test-pzkmgq7yyenl059v.mlsender.net", "Your Name");
      const recipients = [
        new Recipient(recipientEmail, "Recipient Name")
      ];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("Email verification")
      .setHtml(`<strong><a href='${process.env.BACK_URL}/api/verifyUser?email=${recipientEmail}'>Verify email</a></strong>`)
      .setText("This is a test email");

    const response = await mailerSend.email.send(emailParams);
    // console.log("Email sent successfully:", response);
  } catch (error) {
    // console.error("Error sending email:", error);
  }
}

module.exports = sendVerificationEmail;