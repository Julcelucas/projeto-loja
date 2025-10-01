// mailer.js
require('dotenv').config(); // garante que .env é lido se alguém requer este ficheiro diretamente
const nodemailer = require('nodemailer');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('⚠️ Variáveis EMAIL_USER/EMAIL_PASS não definidas. Verifica o ficheiro .env');
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((err) => {
  if (err) {
    console.error('❌ Erro SMTP (mailer.js):', err);
  } else {
    console.log('✅ Servidor SMTP pronto (mailer.js).');
  }
});

module.exports = transporter;
