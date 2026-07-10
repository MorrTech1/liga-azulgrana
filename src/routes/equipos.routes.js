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
router.get('/',verificarToken,soloAdmin, async (req, res) => {
    try {

        const ligaId = req.usuario.liga_id;

        const resultado = await pool.query(`
           SELECT
    e.id,
    e.nombre,
    e.escudo,
    e.categoria_id AS "categoriaId",
    c.nombre AS categoria
FROM equipos e
INNER JOIN categorias c
    ON e.categoria_id = c.id
WHERE
    e.activo = TRUE
    AND c.liga_id = $1
ORDER BY e.nombre;
        `, [ligaId]);

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
            
            const ligaId = req.usuario.liga_id;

            // Verificar que la categoría exista
            const categoria = await pool.query(
                `
                SELECT id
                FROM categorias
                WHERE id = $1
                  AND liga_id = $2
                  AND activa = TRUE
                `,
                [categoriaId, ligaId]
            );

            if (categoria.rows.length === 0) {
                return res.status(403).json({
                    mensaje: "La categoría no existe o no pertenece a tu liga."
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


router.put(
    '/:id',
    verificarToken,
    soloAdmin,
    uploadEquipo.single('logo'),
    async (req, res) => {

        try {

            const id = Number(req.params.id);
            const { nombre } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    mensaje: "El nombre es obligatorio."
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
                WHERE e.id = $1
                  AND c.liga_id = $2;
                `,
                [id, ligaId]
            );

            if (equipo.rows.length === 0) {
                return res.status(404).json({
                    mensaje: "Equipo no encontrado."
                });
            }

            let consulta;
            let parametros;

            if (req.file) {

                const logo = `/uploads/equipos/${req.file.filename}`;

                consulta = `
                    UPDATE equipos
                    SET
                        nombre = $1,
                        escudo = $2,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                    RETURNING *;
                `;

                parametros = [nombre, logo, id];

            } else {

                consulta = `
                    UPDATE equipos
                    SET
                        nombre = $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING *;
                `;

                parametros = [nombre, id];

            }

            const resultado = await pool.query(
                consulta,
                parametros
            );

            res.json(resultado.rows[0]);

        } catch (error) {

            console.error(error);

            if (error.code === "23505") {
                return res.status(400).json({
                    mensaje: "Ya existe un equipo con ese nombre."
                });
            }

            res.status(500).json({
                mensaje: "Error actualizando equipo."
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
        const ligaId = req.usuario.liga_id;

        // Verificar que el equipo pertenezca a la liga del administrador
        const equipo = await pool.query(
            `
            SELECT e.id
            FROM equipos e
            INNER JOIN categorias c
                ON e.categoria_id = c.id
            WHERE
                e.id = $1
                AND c.liga_id = $2;
            `,
            [id, ligaId]
        );

        if (equipo.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Equipo no encontrado o no pertenece a tu liga."
            });
        }

        // Verificar si tiene partidos asociados
        const partidos = await pool.query(
            `
            SELECT id
            FROM partidos
            WHERE equipo_local_id = $1
               OR equipo_visitante_id = $1
            LIMIT 1;
            `,
            [id]
        );

        if (partidos.rows.length > 0) {
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
