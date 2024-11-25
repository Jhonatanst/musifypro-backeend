const express = require("express")
const router = express.Router();
const artistaController = require("../controller/artistaController");
const multer = require("multer");

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../db/db');  // Conexión a tu base de datos


// Ruta de inicio de sesión
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Buscar al usuario en la base de datos
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    connection.query(query, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
        }

        const user = results[0];

        // Verificar la contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
        }

        // Si la contraseña es válida, generar el token
        const token = jwt.sign(
            { userId: user.id, name: user.name, email: user.email },  // Datos del usuario
            process.env.JWT_SECRET,  // Clave secreta
            { expiresIn: '1h' }  // El token expirará en 1 hora
        );

        // Enviar el token como respuesta
        res.json({ message: 'Inicio de sesión exitoso', token });
    });
});



// Middleware para verificar el token JWT
const authenticate = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Acceso no autorizado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Guardamos los datos del usuario en la petición
        next();  // Continuamos con la siguiente función en la ruta
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};





// configurarion de alamacenamiento con multer(subida local a "uploads")
const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null, "uploads/"); //carpeta donde se guardaran los archivos
    },
    filename: (req, file,cb)=> {
        cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo
    }
});
const fileFilter = (req, file, cb) => {
    console.log("Mimetype recibido:", file.mimetype);  // Imprime el mimetype recibido
    const allowedTypes = [
        'audio/mpeg',    // .mp3
        'audio/wav',     // .wav estándar
        'audio/x-wav',   // .wav en otros sistemas
        'audio/wave',    // .wav detectado como wave
        'audio/flac',    // .flac estándar
        'audio/x-flac',   // .flac en otros sistemas
        'image/jpeg'   // .img
    ];

    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen y audio'), false);
    }
};






const upload = multer({
    storage:storage,
    fileFilter: fileFilter,
    authenticate: authenticate,
    limits: {fileSize: 100 * 10024 * 1024}

});

// Ruta para subir música (con archivos)
router.post('/upload', upload.fields([{ name: 'portada', maxCount: 1 }, { name: 'pista', maxCount: 1 }]), artistaController.uploadMusic);
//  Ruta para subir musica


// Ruta para verificar el código de confirmación
router.post('/verify', artistaController.verifyCode);

// Ruta para registrar un artista
router.post("/register", artistaController.register);

module.exports = router









