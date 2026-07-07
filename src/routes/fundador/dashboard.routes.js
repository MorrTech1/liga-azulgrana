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

            // Total ligas
            const ligas = await pool.query(`
                SELECT COUNT(*)::int AS total
                FROM ligas;
            `);

            // Ligas activas
            const activas = await pool.query(`
                SELECT COUNT(*)::int AS total
                FROM ligas
                WHERE activa = TRUE;
            `);

            // Ligas suspendidas
            const suspendidas = await pool.query(`
                SELECT COUNT(*)::int AS total
                FROM ligas
                WHERE activa = FALSE;
            `);

            // Administradores
            const administradores = await pool.query(`
                SELECT COUNT(*)::int AS total
                FROM usuarios
                WHERE rol = 'admin'
                  AND activo = TRUE;
            `);

            // Últimas ligas
            const ultimas = await pool.query(`
                SELECT

                    l.id,

                    l.nombre,

                    l.activa,

                    u.nombre AS administrador

                FROM ligas l

                LEFT JOIN usuarios u
                    ON u.liga_id = l.id
                   AND u.rol='admin'

                ORDER BY l.id DESC

                LIMIT 5;
            `);

            res.json({

                ligas: ligas.rows[0].total,

                activas: activas.rows[0].total,

                suspendidas: suspendidas.rows[0].total,

                administradores: administradores.rows[0].total,

                ultimasLigas: ultimas.rows

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                mensaje:"Error obteniendo dashboard."

            });

        }

    }
);

module.exports = router;