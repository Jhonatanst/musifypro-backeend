const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Token en el encabezado "Authorization"

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Error al verificar el token:", err.message);
      return res.status(403).json({ message: "Token inválido o expirado" });
    }

    console.log("Datos del token decodificado:", decoded);
    req.user = decoded; // Agrega los datos del usuario al objeto req
    next();
  });
};



module.exports = authMiddleware;
