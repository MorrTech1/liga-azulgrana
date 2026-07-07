const express = require('express');
const pool = require('../../db');

const {
    verificarToken,
    soloFundador
} = require('../../middlewares/auth.middleware');

const router = express.Router();

// ==========================
// Dashboard Fundador
// ==========================
router.get(
    '/',
    verificarToken,
    soloFundador,
    async (req, res) => {

        try {

            const [
                ligasActivas,
                ligasSuspendidas,
                administradores,
                capturistas,
                equipos,
                jugadores,
                partidos
            ] = await Promise.all([

                pool.query(`
                    SELECT COUNT(*) AS total
                    FROM ligas
                    WHERE activa = TRUE;
                `),

                pool.query(`
                    SELECT COUNT(*) AS total
                    FROM ligas
                    WHERE activa = FALSE;
                `),

                pool.query(`
                    SELECT COUNT(*) AS total
                    FROM usuarios
                    WHERE rol = 'admin'
                      AND activo = TRUE;
                `),

                pool.query(`
                    SELECT COUNT(*) AS total
                    FROM usuarios
                    WHERE rol = 'Capturista'
                      AND activo = TRUE;
                `),

                pool.query(`
                    SELECT COUNT(*) AS total
                    FROM equipos
                    WHERE activo = TRUE;
                `),

                pool.query(`
                    SELECT COUNT(*) AS total
                    FROM jugadores
                    WHERE activo = TRUE;
                `),

                pool.query(`
                    SELECT COUNT(*) AS total
                    FROM partidos;
                `)

            ]);

            res.json({

                ligasActivas: Number(ligasActivas.rows[0].total),

                ligasSuspendidas: Number(ligasSuspendidas.rows[0].total),

                administradores: Number(administradores.rows[0].total),

                capturistas: Number(capturistas.rows[0].total),

                equipos: Number(equipos.rows[0].total),

                jugadores: Number(jugadores.rows[0].total),

                partidos: Number(partidos.rows[0].total)

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                mensaje: 'Error obteniendo dashboard.'
            });

        }

    }
);

module.exports = router;