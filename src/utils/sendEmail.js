const nodemailer = require("nodemailer");
require("dotenv").config(); // Load environment variables from .env

const sendEmail = async (options) => {
  // Create a transporter object using GoDaddy SMTP
  const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email options (plain text only)
  const mailOptions = {
    from: `"CAR HISTORY DEKHO" <team@carhistorydekho.com>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // ✅ Plain text message
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
