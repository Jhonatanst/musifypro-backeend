const express = require('express');
const app = express();
const port = process.env.DB_PORT || 3000; // Cambia a process.env.PORT si estás usando un puerto diferente para el servidor
const connection = require('./db/db'); // Asegúrate de que esté apuntando al archivo correcto
const cors = require('cors');

// Importar las rutas
const artistRoutes = require('./routes/artistasRoutes');

// Configuración de CORS
app.use(cors());

// Middleware para procesar el cuerpo de la solicitud en formato JSON
app.use(express.json());

// Usar las rutas de artista
app.use('/artist', artistRoutes);

// Endpoint de bienvenida en la raíz
app.get('/', (req, res) => {
  res.send(`
    <h1>¡Bienvenido a MusifyPro Backend!</h1>
    <p>La API está funcionando correctamente.</p>
    <p>Visita <strong>/artist</strong> para explorar las rutas de artistas.</p>
  `);
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});