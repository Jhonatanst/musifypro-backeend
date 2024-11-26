const mysql = require('mysql2');

require('dotenv').config({ path: './utils/.env' });

// Crear conexión con la base de datos
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    res.send('<h1>¡Bienvenido a MusifyPro Backend!</h1>');
    return;s
  }
  console.log('Conectado a la base de datos como id ' + connection.threadId);
});

module.exports = connection;
