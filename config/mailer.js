require('dotenv').config();
const nodemailer = require('nodemailer');

require('dotenv').config({ path: './utils/.env' });  // Especifica la ruta de tu .env



// Configurar transporte de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Función para enviar correos
const enviarCorreo = (destinatario, codigo) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: destinatario,
    subject: 'Código de verificación',
    text: `Tu código de verificación es: ${codigo}`
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { enviarCorreo };
