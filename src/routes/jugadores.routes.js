const express = require('express');
const pool = require('../db');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();


// ==============================
// GET jugadores
// ==============================
router.get('/', async (req, res) => {
    try {

        const resultado = await pool.query(`
            SELECT
                j.id,
                j.nombre,
                j.equipo_id AS "equipoId",

                e.nombre AS equipo,

                c.id AS "categoriaId",
                c.nombre AS categoria

            FROM jugadores j

            INNER JOIN equipos e
                ON j.equipo_id = e.id

            INNER JOIN categorias c
                ON e.categoria_id = c.id

            WHERE j.activo = TRUE

            ORDER BY
                c.nombre,
                e.nombre,
                j.nombre;
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error obteniendo jugadores."
        });

    }
});
// ==============================
// POST jugador
// ==============================
// ==============================
// POST jugador
// ==============================
router.post('/', verificarToken, soloAdmin, async (req, res) => {
    try {

        const { nombre, equipoId } = req.body;

        if (!nombre || !equipoId) {
            return res.status(400).json({
                mensaje: "Datos incompletos"
            });
        }

        // Verificar que el equipo exista
        const equipo = await pool.query(
            `
            SELECT id
            FROM equipos
            WHERE id = $1
              AND activo = TRUE;
            `,
            [equipoId]
        );

        if (equipo.rows.length === 0) {
            return res.status(400).json({
                mensaje: "Equipo no válido"
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO jugadores (
                nombre,
                equipo_id
            )
            VALUES ($1, $2)
            RETURNING
                id,
                nombre,
                equipo_id AS "equipoId";
            `,
            [
                nombre,
                equipoId
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error creando jugador."
        });

    }
});
// ==============================
// PUT jugador (editar equipo)
// ==============================
// ==============================
// PUT jugador (editar equipo)
// ==============================
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {

        const id = Number(req.params.id);
        const { equipoId } = req.body;

        if (!equipoId) {
            return res.status(400).json({
                mensaje: "Equipo requerido."
            });
        }

        // Verificar que el equipo exista
        const equipo = await pool.query(
            `
            SELECT id
            FROM equipos
            WHERE id = $1
              AND activo = TRUE;
            `,
            [equipoId]
        );

        if (equipo.rows.length === 0) {
            return res.status(400).json({
                mensaje: "Equipo no válido."
            });
        }

        const resultado = await pool.query(
            `
            UPDATE jugadores
            SET
                equipo_id = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING
                id,
                nombre,
                equipo_id AS "equipoId";
            `,
            [equipoId, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Jugador no encontrado."
            });
        }

        res.json({
            mensaje: "Jugador actualizado correctamente.",
            jugador: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error actualizando jugador."
        });

    }
});
// ==============================
// DELETE jugador
// ==============================
// ==============================
// DELETE jugador
// ==============================
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {

        const id = Number(req.params.id);

        const resultado = await pool.query(
            `
            DELETE FROM jugadores
            WHERE id = $1
            RETURNING
                id,
                nombre,
                equipo_id AS "equipoId";
            `,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Jugador no encontrado."
            });
        }

        res.json({
            mensaje: "Jugador eliminado correctamente.",
            jugador: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error eliminando jugador."
        });

    }
});

module.exports = router;
