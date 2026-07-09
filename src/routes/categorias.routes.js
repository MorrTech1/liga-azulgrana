const express = require('express');
const pool = require('../db'); 

console.log("🚀 Cargando categorias.routes.js NUEVO");

const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();


// helpers





// ===============================
// GET /categorias
// ===============================
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {

    const ligaId = req.usuario.liga_id;

const resultado = await pool.query(
    `
    SELECT *
    FROM categorias
    WHERE liga_id = $1
    ORDER BY nombre;
    `,
    [ligaId]
);

    res.json(resultado.rows);

  } catch (error) {

    console.error("ERROR CATEGORIAS:", error);

    res.status(500).json({
        mensaje: "Error obteniendo categorías",
        error: error.message,
        code: error.code
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

        const ligaId = req.usuario.liga_id;

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

        // Verificar si existen equipos en la categoría
        const equipos = await pool.query(
            `
            SELECT id
            FROM equipos
            WHERE categoria_id = $1
            LIMIT 1;
            `,
            [id]
        );

        if (equipos.rows.length > 0) {

            return res.status(400).json({

                mensaje: "No puedes eliminar una categoría que tiene equipos registrados."

            });

        }

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
