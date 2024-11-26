const bcrypt = require('bcryptjs');  // Para hash de contraseñas
const { enviarCorreo } = require('../config/mailer');  // Función de envío de correo
const connection = require('../db/db');  // Conexión a la base de datos

// Registro de usuario
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    // Validar formato de correo Gmail
    if (!email.endsWith('@gmail.com')) {
        return res.status(400).json({ message: 'Solo se permiten correos de Gmail' });
    }

    // Validar fortaleza de la contraseña
    if (password.length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        // Generar código de verificación (6 dígitos)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Guardar usuario en la base de datos
        const query = 'INSERT INTO usuarios (name, email, password, rol, verification_code) VALUES (?, ?, ?, ?, ?)';
        connection.query(query, [name, email, hashedPassword, 'artista', verificationCode], (err) => {
            if (err) {
                console.error('Error al registrar:', err);
                return res.status(500).json({ message: 'Error en el registro. Inténtalo de nuevo.' });
            }

            // Enviar código por correo
            enviarCorreo(email, verificationCode);

            res.status(200).json({ message: 'Código de verificación enviado. Revisa tu correo electrónico.' });
        });
        
    } catch (error) {
        console.error('Error general:', error);
        res.status(500).json({ message: 'Error al registrar usuario.' });
    }
};

// Verificación del código
exports.verifyCode = (req, res) => {
    const { email, code } = req.body;

    const query = 'SELECT * FROM usuarios WHERE email = ? AND verification_code = ?';
    connection.query(query, [email, code], (err, results) => {
        if (err) {
            console.error('Error al buscar usuario:', err);
            return res.status(500).json({ message: 'Error en la verificación.' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'Código incorrecto o expirado.' });
        }

        // Actualizar el estado del usuario a verificado (elimina verification_code)
        const updateQuery = 'UPDATE usuarios SET verification_code = NULL WHERE email = ?';
        connection.query(updateQuery, [email], (updateErr) => {
            if (updateErr) {
                console.error('Error al actualizar usuario:', updateErr);
                return res.status(500).json({ message: 'Error al verificar usuario.' });
            }
            res.status(200).json({ message: 'Usuario verificado con éxito.' });
        });
    });
};

const jwt = require('jsonwebtoken');


// Ruta para el inicio de sesión
exports.login = (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM usuarios WHERE email = ?';
    connection.query(query, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
        }

        const user = results[0];

        // Verificar que la contraseña coincida
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
        }

        // Generar un token JWT
        const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, process.env.JWT_SECRET, {
            expiresIn: '1h'  // El token expirará en 1 hora
        });

        // Enviar el token al frontend
        res.status(200).json({ message: 'Inicio de sesión exitoso', token });
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
        fecha_lanzamiento, // Asegúrate de capturar esto correctamente
        // ...otros campos

        disquera, 
        lugar_grabacion, 
        codigo_upc, 
        titulo_cancion, 
        compositor, 
    
        hora_inicio_tiktok 
        
    } = req.body;

    const portada = req.files['portada'] ? req.files['portada'][0].path : null;
    const pista = req.files['pista'] ? req.files['pista'][0].path : null;
    
    // Convertir "si" a 1, y cualquier otro valor a 0
    const letra_explicita = (req.body.letra_explicita && req.body.letra_explicita.toLowerCase() === 'si') ? 1 : 0;
    const es_cover = (req.body.es_cover && req.body.es_cover.toLowerCase() === 'si') ? 1 : 0;
    const publicado_antes = (req.body.publicado_antes && req.body.publicado_antes.toLowerCase() === 'si') ? 1 : 0;


    
    // Verifica que los campos se hayan recibido
    console.log(req.body);
    console.log(req.files);
    console.log('Portada:', req.files['portada']);
    console.log('Pista:', req.files['pista']);
    console.log('Correo:', process.env.EMAIL_USER);
    console.log('Contraseña:', process.env.EMAIL_PASS);
    // Validar fecha antes de insertarla
    if (!fecha_lanzamiento || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_lanzamiento)) {
        return res.status(400).json({ message: 'Fecha de lanzamiento inválida o no proporcionada' });
    }
    // Convertir "si" a 1, y cualquier otro valor a 0


    const query = `
        INSERT INTO lanzamientos 
        (titulo_unico, nombre_artista, letra_explicita, idioma, genero_primario, genero_secundario, 
        fecha_lanzamiento, publicado_antes, disquera, lugar_grabacion, codigo_upc, titulo_cancion, compositor, 
        es_cover, hora_inicio_tiktok, portada, pista) 
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        titulo_unico, nombre_artista, letra_explicita, idioma, genero_primario, genero_secundario,
        fecha_lanzamiento, publicado_antes, disquera, lugar_grabacion, codigo_upc, titulo_cancion, compositor,
        es_cover, hora_inicio_tiktok, portada, pista
    ];

    connection.query(query, values, (err, results) => {
        if (err) {
            console.error('Error al insertar el lanzamiento:', err);
            return res.status(500).json({ message: 'Error al subir el lanzamiento' });
        }
        res.status(201).json({ message: 'Lanzamiento subido correctamente', id: results.insertId });
    });
};
