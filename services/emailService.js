const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP credentials at boot so failures surface immediately
// rather than silently at send time.
transporter.verify((error) => {
  if (error) {
    console.error("SMTP CONNECTION FAILED:", error.message);
  } else {
    console.log("SMTP server is ready to send mail");
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"SecureVault" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.response);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
  } catch (error) {
    console.error("EMAIL ERROR:");
    console.error(error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};