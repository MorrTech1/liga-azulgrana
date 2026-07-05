const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura';

// =======================
// LOGIN
// =======================
router.post('/login', async (req, res) => {

    try {

        const { email, password } = req.body;

        const resultado = await pool.query(
            `
            SELECT
                id,
                nombre,
                email,
                password,
                rol,
                liga_id
            FROM usuarios
            WHERE email = $1
              AND activo = TRUE;
            `,
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                mensaje: 'Credenciales inválidas'
            });
        }

        const usuario = resultado.rows[0];

        // Más adelante aquí usaremos bcrypt
        if (usuario.password !== password) {
            return res.status(401).json({
                mensaje: 'Credenciales inválidas'
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol,
                liga_id: usuario.liga_id
            },
            SECRET,
            {
                expiresIn: '2h'
            }
        );

        console.log(usuario);

        res.json({
            mensaje: 'Login exitoso',
            token,
            rol: usuario.rol
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error iniciando sesión.'
        });

    }

});

module.exports = router;