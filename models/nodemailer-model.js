const nodeMailer = require("nodemailer");

const transporter = nodeMailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.GMAIL_NODE,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

module.exports = transporter;