const express = require('express');
const pool = require('../db');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();





// ==============================
// GET jugadores
// ==============================
router.get('/', verificarToken, soloAdmin, async (req, res) => {

    try {

        const ligaId = req.usuario.liga_id;

        const resultado = await pool.query(`
            SELECT

                j.id,
                j.nombre,
                j.numero,
                j.equipo_id AS "equipoId",

                e.nombre AS equipo,

                c.id AS "categoriaId",
                c.nombre AS categoria

            FROM jugadores j

            INNER JOIN equipos e
                ON j.equipo_id = e.id

            INNER JOIN categorias c
                ON e.categoria_id = c.id

            WHERE

                j.activo = TRUE
                AND c.liga_id = $1

            ORDER BY

                c.nombre,
                e.nombre,
                j.numero,
                j.nombre;

        `, [ligaId]);

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

router.post('/', verificarToken, soloAdmin, async (req, res) => {

    try {

        const { nombre, numero, equipoId } = req.body;

        if (!nombre || !equipoId || !numero) {
            return res.status(400).json({
                mensaje: "Datos incompletos"
            });
        }

        const ligaId = req.usuario.liga_id;

        const equipo = await pool.query(
            `
            SELECT e.id
            FROM equipos e
            INNER JOIN categorias c
                ON e.categoria_id = c.id
            WHERE
                e.id = $1
                AND e.activo = TRUE
                AND c.liga_id = $2;
            `,
            [
                equipoId,
                ligaId
            ]
        );

        if (equipo.rows.length === 0) {
            return res.status(403).json({
                mensaje: "El equipo no pertenece a tu liga."
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO jugadores (

                nombre,
                numero,
                equipo_id

            )

            VALUES ($1,$2,$3)

            RETURNING

                id,
                nombre,
                numero,
                equipo_id AS "equipoId";
            `,
            [
                nombre,
                numero,
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
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {

        const id = Number(req.params.id);

        const { nombre, numero, equipoId } = req.body;

        if (!nombre || !numero || !equipoId) {
            return res.status(400).json({
                mensaje: "Datos incompletos."
            });
        }

        const ligaId = req.usuario.liga_id;

        // Verificar que el equipo pertenezca a la liga
        const equipo = await pool.query(
            `
            SELECT e.id
            FROM equipos e
            INNER JOIN categorias c
                ON e.categoria_id = c.id
            WHERE
                e.id = $1
                AND e.activo = TRUE
                AND c.liga_id = $2;
            `,
            [
                equipoId,
                ligaId
            ]
        );

        if (equipo.rows.length === 0) {
            return res.status(403).json({
                mensaje: "El equipo no pertenece a tu liga."
            });
        }

        const resultado = await pool.query(
            `
            UPDATE jugadores
            SET
                nombre = $1,
                numero = $2,
                equipo_id = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING
                id,
                nombre,
                numero,
                equipo_id AS "equipoId";
            `,
            [
                nombre,
                numero,
                equipoId,
                id
            ]
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

router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {

        const id = Number(req.params.id);
        const ligaId = req.usuario.liga_id;

        // Verificar que el jugador pertenezca a la liga del administrador
        const jugador = await pool.query(
            `
            SELECT j.id
            FROM jugadores j
            INNER JOIN equipos e
                ON j.equipo_id = e.id
            INNER JOIN categorias c
                ON e.categoria_id = c.id
            WHERE
                j.id = $1
                AND c.liga_id = $2
                AND j.activo = TRUE;
            `,
            [id, ligaId]
        );

        if (jugador.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Jugador no encontrado o no pertenece a tu liga."
            });
        }

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
