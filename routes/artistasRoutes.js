const express = require("express");
const router = express.Router();
const artistaController = require("../controller/artistaController");
const multer = require("multer");
const authMiddleware = require("../utils/middleware");

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "audio/mpeg", "audio/wav", "audio/x-wav", "audio/wave",
    "audio/flac", "audio/x-flac", "image/jpeg", "image/png",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen y audio"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
}).fields([
  { name: "portada", maxCount: 1 },
  { name: "pista", maxCount: 1 },
]);

// Rutas
router.post("/register", artistaController.register);
router.post("/login", artistaController.login);
router.post("/verify", artistaController.verifyCode);
router.post("/resendVerificationCode", artistaController.resendVerificationCode);




// Ruta protegida para subir lanzamientos
router.post("/upload", authMiddleware, upload, artistaController.uploadMusic);






module.exports = router;
