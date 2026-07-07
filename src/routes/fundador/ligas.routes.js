const express = require('express');
const pool = require('../../db');

const {
    verificarToken,
    soloFundador
} = require('../../middlewares/auth.middleware');

const router = express.Router();


// =======================
// GET /fundador/ligas
// =======================
router.get(
    '/',
    verificarToken,
    soloFundador,
    async (req, res) => {

        try {

            const resultado = await pool.query(`
               SELECT
    id,
    nombre,
    logo,
    color_principal AS "colorPrincipal",
    color_secundario AS "colorSecundario",
    activa,
    created_at AS "createdAt"
FROM ligas
ORDER BY nombre;
            `);

            res.json(resultado.rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                mensaje: 'Error obteniendo ligas.'
            });

        }

    }
);

module.exports = router;