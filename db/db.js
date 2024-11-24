const mysql = require('mysql2');

// Crear conexión con la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // Por defecto en XAMPP, el usuario es 'root'
  password: '',  // Sin contraseña por defecto en XAMPP
  database: 'musifypro',  // Nombre de la base de datos
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar con la base de datos: ' + err.stack);
    return;s
  }
  console.log('Conectado a la base de datos como id ' + connection.threadId);
});

module.exports = connection;
