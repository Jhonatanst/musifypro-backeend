const bcrypt = require("bcrypt"); // Para hash de contraseñas
const jwt = require("jsonwebtoken"); // Para manejo de tokens JWT
const { enviarCorreo } = require("../config/mailer"); // Función de envío de correo
const connection = require("../db/db"); // Conexión a la base de datos

// Registro de usuario
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!email.endsWith("@gmail.com")) {
    return res.status(400).json({ message: "Solo se permiten correos de Gmail." });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres." });
  }

  try {
    // Verificar si el correo ya está registrado
    const checkEmailQuery = "SELECT * FROM usuarios WHERE email = ?";
    connection.query(checkEmailQuery, [email], async (err, results) => {
      if (err) {
        console.error("Error al verificar el correo:", err);
        return res.status(500).json({ message: "Error al verificar el correo." });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: "El correo ya está registrado." });
      }

      // Crear código de verificación
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 5);

      // Hash de contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Registrar el usuario
      const insertQuery = 
        "INSERT INTO usuarios (name, email, password, rol, verification_code, verification_expiration) " +
        "VALUES (?, ?, ?, 'artista', ?, ?)";
      connection.query(
        insertQuery,
        [name, email, hashedPassword, verificationCode, expirationDate],
        (insertErr) => {
          if (insertErr) {
            console.error("Error al registrar:", insertErr);
            return res.status(500).json({ message: "Error al registrar usuario." });
          }

          // Enviar correo de verificación
          enviarCorreo(email, verificationCode)
            .then(() => res.status(200).json({
              message: "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
            }))
            .catch((mailErr) => {
              console.error("Error al enviar correo:", mailErr);
              return res.status(500).json({ message: "Error al enviar correo de verificación." });
            });
        }
      );
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ message: "Error al registrar usuario." });
  }
};

// Obtener los lanzamientos del usuario autenticado
exports.lanzamientosGet =  async (req, res) => {
  try {
    const userId = req.user.id; // El id del usuario autenticado extraído del token

    // Consulta los lanzamientos en la base de datos
    const [launches] = await connection.query("SELECT * FROM lanzamientos WHERE user_id = ?", [userId]);

    res.json(launches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los lanzamientos" });
  }
};

exports.verifyCode = (req, res) => {
  const { email, code } = req.body;

  const query = "SELECT * FROM usuarios WHERE email = ?";
  connection.query(query, [email], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Usuario no encontrado." });
    }

    const user = results[0];
    const currentTime = new Date();

    // Verificar el código y la expiración
    if (user.verification_code !== code) {
      return res.status(400).json({ message: "Código incorrecto." });
    }
    if (currentTime > new Date(user.verification_expiration)) {
      return res.status(403).json({ message: "El código ha expirado." });
    }

    // Actualizar para marcar como verificado
    const updateQuery = 
      "UPDATE usuarios SET verification_code = NULL, verification_expiration = NULL WHERE email = ? AND verification_code = ?";
    connection.query(updateQuery, [email, code], (updateErr) => {
      if (updateErr) {
        console.error("Error al actualizar usuario:", updateErr);
        return res.status(500).json({ message: "Error al verificar usuario." });
      }

      // Generar el token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET, // Clave secreta definida en .env
        { expiresIn: "1h" } // Token válido por 1 hora
      );

      // Responder con éxito y el token
      res.status(200).json({
        message: "Usuario verificado con éxito.",
        token, // Enviamos el token al frontend
      });
    });
  });
};

// Reenviar código de verificación
exports.resendVerificationCode = (req, res) => {
  const { email } = req.body;

  const query = "SELECT * FROM usuarios WHERE email = ?";
  connection.query(query, [email], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Usuario no encontrado." });
    }

    const user = results[0];
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 5);

    const updateQuery = 
      "UPDATE usuarios SET verification_code = ?, verification_expiration = ? WHERE email = ?";
    connection.query(updateQuery, [newCode, expirationDate, email], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ message: "Error al generar nuevo código." });
      }

      enviarCorreo(email, newCode)
        .then(() => res.status(200).json({ message: "Nuevo código enviado." }))
        .catch((mailErr) => {
          console.error("Error al enviar correo:", mailErr);
          return res.status(500).json({ message: "Error al enviar correo." });
        });
    });
  });
};

// Inicio de sesión
exports.login = (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM usuarios WHERE email = ?";
  connection.query(query, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Usuario o contraseña incorrectos." });
    }

    const user = results[0];

    // 1. Verificar que la contraseña es correcta
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Usuario o contraseña incorrectos." });
    }

    // 2. Verificar si la cuenta ya está verificada
    if (user.verification_code === null) {
      // La cuenta ya está verificada, procedemos con la generación del token
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({ 
        status: "verified",
        message: "Inicio de sesión exitoso", token });
    }

    // 3. Si la cuenta no está verificada, verificar si el código de verificación ha expirado
    const currentTime = new Date();
    const expirationTime = new Date(user.verification_expiration);

    if (currentTime > expirationTime) {
      // El código ha expirado, generar uno nuevo y enviarlo
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpirationDate = new Date();
      newExpirationDate.setMinutes(newExpirationDate.getMinutes() + 5);

      // Actualizar el código de verificación y la expiración
      const updateQuery = 
        "UPDATE usuarios SET verification_code = ?, verification_expiration = ? WHERE email = ?";
      connection.query(updateQuery, [newCode, newExpirationDate, email], 
        (updateErr) => {
        if (updateErr) {
          console.error("Error al actualizar el código de verificación:", updateErr);
          return res.status(500).json({ message: "Error al generar nuevo código." });
        }

        // Enviar correo con el nuevo código de verificación
        enviarCorreo(email, newCode)
          .then(() => res.status(200).json({
            status: "not verified",
              message: "El código de verificación ha expirado. Se ha enviado un nuevo código a tu correo.",
              codeValidUntil: user.verification_expiration, // Esto puede ayudar en el frontend
          }))
          .catch((mailErr) => {
            console.error("Error al enviar correo:", mailErr);
            return res.status(500).json({ message: "Error al enviar correo." });
          });
      });
    } else {
      // El código de verificación no ha expirado, pedir al usuario que ingrese el código
      return res.status(403).json({
        message: "Tu cuenta no está verificada. Por favor, ingresa el código de verificación que te enviamos a tu correo.",
      });
    }
  });
};

// Esta es la única función uploadMusic que necesitas
exports.uploadMusic = (req, res) => {
  const {
    titulo_unico,
    nombre_artista,
    idioma,
    genero_primario,
    genero_secundario,
    fecha_lanzamiento,
    disquera,
    lugar_grabacion,
    codigo_upc,
    titulo_cancion,
    compositor,
    hora_inicio_tiktok,
  } = req.body;

  // Archivos subidos
  const portada = req.files?.portada?.[0]?.path || null;
  const pista = req.files?.pista?.[0]?.path || null;

  const letra_explicita = req.body.letra_explicita?.toLowerCase() === "si" ? 1 : 0;
  const es_cover = req.body.es_cover?.toLowerCase() === "si" ? 1 : 0;
  const publicado_antes = req.body.publicado_antes?.toLowerCase() === "si" ? 1 : 0;

  console.log("Usuario autenticado:", req.user);
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }
  if (!titulo_unico || !nombre_artista || !idioma) {
    return res.status(400).json({
      message: "Título único, nombre del artista e idioma son obligatorios",
    });
  }
  if (!fecha_lanzamiento || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_lanzamiento)) {
    return res.status(400).json({ message: "Fecha de lanzamiento inválida" });
  }

  const query = `
    INSERT INTO lanzamientos (
      titulo_unico, nombre_artista, letra_explicita, es_cover, publicado_antes, 
      idioma, genero_primario, genero_secundario, fecha_lanzamiento, disquera, 
      lugar_grabacion, codigo_upc, titulo_cancion, compositor, hora_inicio_tiktok, portada, pista, user_id
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    titulo_unico, nombre_artista, letra_explicita, es_cover, publicado_antes, idioma, 
    genero_primario, genero_secundario, fecha_lanzamiento, disquera, lugar_grabacion, 
    codigo_upc, titulo_cancion, compositor, hora_inicio_tiktok, portada, pista, req.user.id
  ];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error("Error al subir el lanzamiento:", err);
      return res.status(500).json({ message: "Hubo un error al subir el lanzamiento" });
    }

    res.status(200).json({ message: "Lanzamiento subido exitosamente" });
  });
};











// Esta es la única función uploadMusic que necesitas
exports.uploadMusic = (req, res) => {
  const {
    titulo_unico,
    nombre_artista,
    idioma,
    genero_primario,
    genero_secundario,
    fecha_lanzamiento,
    disquera,
    lugar_grabacion,
    codigo_upc,
    titulo_cancion,
    compositor,
    hora_inicio_tiktok,
  } = req.body;

  // Archivos subidos
  const portada = req.files?.portada?.[0]?.path || null;
  const pista = req.files?.pista?.[0]?.path || null;

  const letra_explicita = req.body.letra_explicita?.toLowerCase() === "si" ? 1 : 0;
  const es_cover = req.body.es_cover?.toLowerCase() === "si" ? 1 : 0;
  const publicado_antes = req.body.publicado_antes?.toLowerCase() === "si" ? 1 : 0;

  console.log("Usuario autenticado:", req.user);
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }
  if (!titulo_unico || !nombre_artista || !idioma) {
    return res.status(400).json({
      message: "Título único, nombre del artista e idioma son obligatorios",
    });
  }
  if (!fecha_lanzamiento || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_lanzamiento)) {
    return res.status(400).json({ message: "Fecha de lanzamiento inválida" });
  }

  const query = `
    INSERT INTO lanzamientos (
      titulo_unico, nombre_artista, letra_explicita, idioma, genero_primario, genero_secundario,
      fecha_lanzamiento, publicado_antes, disquera, lugar_grabacion, codigo_upc, titulo_cancion,
      compositor, es_cover, hora_inicio_tiktok, portada, pista, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   `;

  const values = [
    titulo_unico, nombre_artista, letra_explicita, idioma, genero_primario,
    genero_secundario, fecha_lanzamiento, publicado_antes, disquera, lugar_grabacion,
    codigo_upc, titulo_cancion, compositor, es_cover, hora_inicio_tiktok, portada, pista, req.user.id,
  ];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error("Error al subir el lanzamiento:", err);
      return res.status(500).json({ message: "Error al subir el lanzamiento" });
    }
    res.status(201).json({ message: "Lanzamiento subido correctamente", id: results.insertId });
  });
};
