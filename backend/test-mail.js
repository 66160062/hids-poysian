require('dotenv').config();
const nodemailer = require('nodemailer');

async function testMail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER, // sender address
      to: process.env.SMTP_USER, // list of receivers (send to self)
      subject: "Test Email from HIDS Backend ✔", // Subject line
      text: "Hello world? This is a test email to verify SMTP configuration.", // plain text body
      html: "<b>Hello world?</b><br>This is a test email to verify SMTP configuration.", // html body
    });

    console.log("✅ Message sent successfully!");
    console.log("Message ID: %s", info.messageId);
  } catch (error) {
    console.error("❌ Error sending email: ", error.message);
  }
}

testMail();
