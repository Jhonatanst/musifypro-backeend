const express = require("express")
const router = express.Router();
const artistaController = require("../controller/artistaController");
const multer = require("multer");


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









