const express = require('express');
const pool = require('../db');

const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();


// =======================
// GET /usuarios
// =======================
router.get('/', verificarToken, soloAdmin, async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                id,
                nombre,
                email,
                rol,
                liga_id AS "ligaId",
                activo,
                created_at AS "createdAt"
            FROM usuarios
            ORDER BY nombre;
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error obteniendo usuarios.'
        });

    }

});

// =======================
// POST /usuarios
// =======================
router.post('/', verificarToken, soloAdmin, async (req, res) => {

    try {

        const {
            nombre,
            email,
            password,
            rol,
            ligaId
        } = req.body;

        if (!nombre || !email || !password || !rol || !ligaId) {
            return res.status(400).json({
                mensaje: 'Datos incompletos.'
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO usuarios
            (
                nombre,
                email,
                password,
                rol,
                liga_id
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING
                id,
                nombre,
                email,
                rol,
                liga_id AS "ligaId";
            `,
            [
                nombre,
                email,
                password,
                rol,
                ligaId
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {

        console.error(error);

        if (error.code === '23505') {
            return res.status(400).json({
                mensaje: 'Ya existe un usuario con ese correo.'
            });
        }

        res.status(500).json({
            mensaje: 'Error creando usuario.'
        });

    }

});


module.exports = router;