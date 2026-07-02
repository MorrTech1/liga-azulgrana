const express = require('express');
const pool = require('../db'); 

console.log("🚀 Cargando categorias.routes.js NUEVO");

const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();


// helpers


// ===============================
// GET /categorias
// ===============================
router.get('/', async (req, res) => {
  try {

    const resultado = await pool.query(`
      SELECT *
      FROM categorias
      ORDER BY nombre
    `);

    res.json(resultado.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      mensaje: "Error obteniendo categorías"
    });

  }
});

// ===============================
// POST /categorias
// ===============================
router.post('/', verificarToken, soloAdmin, async (req, res) => {
    try {

        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({
                mensaje: "Nombre requerido"
            });
        }

        // Temporalmente todas pertenecen a la liga 1
        const ligaId = 1;

        const resultado = await pool.query(
            `
            INSERT INTO categorias (nombre, liga_id)
            VALUES ($1, $2)
            RETURNING *;
            `,
            [nombre, ligaId]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {

        console.error(error);

        // Si ya existe la categoría
        if (error.code === '23505') {
            return res.status(400).json({
                mensaje: "Ya existe una categoría con ese nombre."
            });
        }

        res.status(500).json({
            mensaje: "Error creando categoría."
        });

    }
});

// ===============================
// DELETE /categorias/:id
// ===============================
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {

        const id = Number(req.params.id);

        const resultado = await pool.query(
            `
            DELETE FROM categorias
            WHERE id = $1
            RETURNING *;
            `,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Categoría no encontrada."
            });
        }

        res.json({
            mensaje: "Categoría eliminada correctamente."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error eliminando categoría."
        });

    }
});

module.exports = router;
