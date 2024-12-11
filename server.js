const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

// Conexión a la base de datos
require('./db/db');

// Importar rutas
const artistRoutes = require('./routes/artistasRoutes');

// Configuración de middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Usar rutas
app.use('/artist', artistRoutes);

// Endpoint de bienvenida
app.get('/', (req, res) => {
  res.send(`
    <h1>¡Bienvenido a MusifyPro Backend!</h1>
    <p>API funcionando correctamente.</p>
    <p>Visita <strong>/artist</strong> para explorar las rutas.</p>
  `);
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});




