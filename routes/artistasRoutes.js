const express = require("express")
const router = express.Router();
const artistaController = require("../controller/artistaController");
const multer = require("multer");

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../db/db');  // Conexión a tu base de datos


// Ruta de inicio de sesión
// Ruta de inicio de sesión
// Inicio de sesión
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Buscar al usuario por email
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    connection.query(query, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
        }

        const user = results[0];

        // Verificar si el usuario está verificado
        if (user.verification_code !== null) {
            return res.status(403).json({ message: 'Debes verificar tu cuenta antes de iniciar sesión.' });
        }

        // Verificar la contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
        }

        // Si la contraseña es válida y el usuario está verificado, generar el token
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
// Verificación de cuenta
router.post('/verify', (req, res) => {
    const { email, code } = req.body;

    // Buscar al usuario por email
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    connection.query(query, [email], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: 'Usuario no encontrado.' });
        }

        const user = results[0];

        // Verificar si el código coincide
        if (user.verification_code !== code) {
            return res.status(400).json({ message: 'Código de verificación incorrecto.' });
        }

        // Si el código es correcto, actualizar verification_code a NULL
        const updateQuery = 'UPDATE usuarios SET verification_code = NULL WHERE email = ?';
        connection.query(updateQuery, [email], (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ message: 'Error al verificar la cuenta.' });
            }

            res.json({ message: 'Cuenta verificada con éxito.' });
        });
    });
});


// Ruta para registrar un artista
router.post("/register", artistaController.register);

module.exports = router









