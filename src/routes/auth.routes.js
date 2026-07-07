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

        u.id,

        u.nombre,

        u.email,

        u.password,

        u.rol,

        u.liga_id,

        l.activa AS liga_activa

    FROM usuarios u

    LEFT JOIN ligas l
        ON u.liga_id = l.id

    WHERE

        u.email = $1

        AND u.activo = TRUE;
    `,
    [email]
);


        
        const usuario = resultado.rows[0];

        // Más adelante aquí usaremos bcrypt
        if (usuario.password !== password) {
            return res.status(401).json({
                mensaje: 'Credenciales inválidas'
            });
        }

        // Si no es fundador y la liga está suspendida
       if (

    usuario.rol !== 'Fundador'

    &&

    usuario.liga_activa === false

) {

    return res.status(403).json({

        mensaje: 'La liga se encuentra suspendida.'

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