const express = require('express');

const pool = require('../db');

const router = express.Router();



// =======================
// Helpers
// =======================


// =======================
// GET /goleo?categoriaId=
// =======================
// =======================
// GET /goleo?categoriaId=
// =======================
router.get('/', async (req, res) => {

    try {

        const ligaId = req.usuario.liga_id;
        const categoriaId = req.query.categoriaId;

        let consulta = `
            SELECT
                j.id,
                j.nombre AS jugador,
                e.nombre AS equipo,
                c.nombre AS categoria,
                SUM(g.cantidad) AS goles

            FROM goles g

            INNER JOIN jugadores j
                ON g.jugador_id = j.id

            INNER JOIN equipos e
                ON j.equipo_id = e.id

            INNER JOIN categorias c
                ON e.categoria_id = c.id

            WHERE
                c.liga_id = $1
        `;

        const valores = [ligaId];

        if (categoriaId) {

            consulta += `
                AND c.id = $2
            `;

            valores.push(categoriaId);

        }

        consulta += `
            GROUP BY
                j.id,
                j.nombre,
                e.nombre,
                c.nombre

            ORDER BY
                SUM(g.cantidad) DESC,
                j.nombre ASC;
        `;

        const resultado = await pool.query(
            consulta,
            valores
        );

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error obteniendo tabla de goleo."
        });

    }

});


module.exports = router;
