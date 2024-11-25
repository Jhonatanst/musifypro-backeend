const express = require('express');
const app = express();
const port = process.env.DB_PORT || 3000;
const connection = require('./db/db'); // Asegúrate de que esté apuntando al archivo de conexión
// Importar las rutas
const artistRoutes = require('./routes/artistasRoutes');


const cors = require('cors');
app.use(cors());

// Middleware para procesar el cuerpo de la solicitud en formato JSON
app.use(express.json());

// Usar las rutas de artista
app.use('/artist', artistRoutes);


// Verificar la conexión en la raíz
app.get('/', (req, res) => {
  connection.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error de conexión a la base de datos', error: err });
    }
    res.json({ message: 'Conexión exitosa a la base de datos', solution: results[0].solution });
  });
});



app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});





