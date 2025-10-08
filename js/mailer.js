// mailer.js
require('dotenv').config();  //garante que .env é lido se alguém requer este ficheiro directamente 
const nodemailer = require('nodemailer');

const isRailway = !!process.env.RAILWAY_ENVIRONMENT;

let transporter;

if (isRailway) {
  // 🔹 Railway: usa API Gmail (sem SMTP bloqueado)
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN
    }
  });
  console.log("📡 Modo Railway: Envio de e-mail via Gmail API (OAuth2)");
} else {
  // 🔹 Local: SMTP normal
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log("💻 Modo Local: Envio de e-mail via SMTP Gmail");
}

transporter.verify((err) => {
  if (err) {
    console.error("❌ Erro SMTP (mailer.js):", err);
  } else {
    console.log("✅ Servidor SMTP pronto (mailer.js).");
  }
});

module.exports = transporter;
