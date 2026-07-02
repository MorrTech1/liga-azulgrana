const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const router = express.Router();

const jugadoresPath = path.join(__dirname, '../data/jugadores.json');
const equiposPath = path.join(__dirname, '../data/equipos.json');

// =======================
// Helpers
// =======================
function leerJSON(ruta) {
  if (!fs.existsSync(ruta)) return [];
  const contenido = fs.readFileSync(ruta, 'utf-8');
  if (!contenido) return [];
  return JSON.parse(contenido);
}

// =======================
// GET /goleo?categoriaId=
// =======================
// =======================
// GET /goleo?categoriaId=
// =======================
router.get('/', async (req, res) => {

    try {

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
        `;

        const valores = [];

        if (categoriaId) {
            consulta += `
                WHERE c.id = $1
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
                goles DESC,
                j.nombre ASC;
        `;

        const resultado = await pool.query(consulta, valores);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error obteniendo tabla de goleo."
        });

    }

});
module.exports = router;
