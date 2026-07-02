const express = require('express');
const pool = require('../db');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const uploadEquipo = require('../middlewares/uploadEquipo');
const fs = require('fs');
const path = require('path');

const partidosPath = path.join(__dirname, '../data/partidos.json');

function leerPartidos() {
    return JSON.parse(fs.readFileSync(partidosPath, 'utf8')); 
}

const router = express.Router();



// ===============================
// GET /equipos
// ===============================
router.get('/', async (req, res) => {
    try {

        const resultado = await pool.query(`
            SELECT
                id,
                nombre,
                escudo AS logo,
                categoria_id AS "categoriaId"
            FROM equipos
            WHERE activo = TRUE
            ORDER BY nombre;
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error obteniendo equipos."
        });

    }
});

// ===============================
// POST /equipos
// ===============================
router.post(
    '/',
    verificarToken,
    soloAdmin,
    uploadEquipo.single('logo'),
    async (req, res) => {

        try {

            const { nombre, categoriaId } = req.body;

            if (!nombre || !categoriaId) {
                return res.status(400).json({
                    mensaje: "Datos incompletos"
                });
            }

            // Verificar que la categoría exista
            const categoria = await pool.query(
                `
                SELECT id
                FROM categorias
                WHERE id = $1
                  AND activa = TRUE;
                `,
                [categoriaId]
            );

            if (categoria.rows.length === 0) {
                return res.status(400).json({
                    mensaje: "Categoría inválida"
                });
            }

            const logo = req.file
                ? `/uploads/equipos/${req.file.filename}`
                : null;

            const resultado = await pool.query(
                `
                INSERT INTO equipos (
                    nombre,
                    escudo,
                    categoria_id
                )
                VALUES ($1, $2, $3)
                RETURNING
                    id,
                    nombre,
                    escudo AS logo,
                    categoria_id AS "categoriaId";
                `,
                [
                    nombre,
                    logo,
                    categoriaId
                ]
            );

            res.status(201).json(resultado.rows[0]);

        } catch (error) {

            console.error(error);

            if (error.code === '23505') {
                return res.status(400).json({
                    mensaje: "Ya existe un equipo con ese nombre en esta categoría."
                });
            }

            res.status(500).json({
                mensaje: "Error creando equipo."
            });

        }

    }
);



// ===============================
// DELETE /equipos/:id
// ===============================
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {

        const id = Number(req.params.id);

        // 🔒 TEMPORAL
        // Mientras migramos partidos, seguimos leyendo partidos.json
        const partidos = JSON.parse(
            fs.readFileSync(partidosPath, 'utf-8')
        );

        const tienePartidos = partidos.some(
            p => Number(p.localId) === id || Number(p.visitanteId) === id
        );

        if (tienePartidos) {
            return res.status(400).json({
                mensaje: "No se puede eliminar el equipo porque tiene partidos asociados."
            });
        }

        const resultado = await pool.query(
            `
            DELETE FROM equipos
            WHERE id = $1
            RETURNING
                id,
                nombre,
                escudo AS logo,
                categoria_id AS "categoriaId";
            `,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Equipo no encontrado."
            });
        }

        res.json({
            mensaje: "Equipo eliminado correctamente.",
            equipo: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error eliminando equipo."
        });

    }
});


module.exports = router;
