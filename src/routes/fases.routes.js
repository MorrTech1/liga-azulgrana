const express = require("express");
const pool = require("../db");

const {
    verificarToken,
    soloAdmin
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
    '/',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const ligaId = req.usuario.liga_id;

            const resultado = await pool.query(
                `
                SELECT

                    f.id,
                    f.nombre,
                    f.orden,

                    c.id AS "categoriaId",
                    c.nombre AS categoria

                FROM fases f

                INNER JOIN categorias c
                    ON f.categoria_id = c.id

                WHERE

                    f.activa = TRUE
                    AND c.liga_id = $1

                ORDER BY

                    c.nombre,
                    f.orden,
                    f.nombre;
                `,
                [ligaId]
            );

            res.json(resultado.rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                mensaje: "Error obteniendo fases."
            });

        }

    }
);


// ===============================
// POST /fases
// ===============================
router.post(
    '/',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const { nombre, categoriaId } = req.body;

            if (!nombre || !categoriaId) {
                return res.status(400).json({
                    mensaje: "Datos incompletos."
                });
            }

            const ligaId = req.usuario.liga_id;

            // Verificar que la categoría pertenezca a la liga
            const categoria = await pool.query(
                `
                SELECT id
                FROM categorias
                WHERE
                    id = $1
                    AND liga_id = $2
                    AND activa = TRUE;
                `,
                [categoriaId, ligaId]
            );

            if (categoria.rows.length === 0) {
                return res.status(403).json({
                    mensaje: "La categoría no pertenece a tu liga."
                });
            }

            const resultado = await pool.query(
                `
                INSERT INTO fases (
                    nombre,
                    categoria_id
                )
                VALUES ($1, $2)
                RETURNING
                    id,
                    nombre,
                    categoria_id AS "categoriaId",
                    orden;
                `,
                [
                    nombre,
                    categoriaId
                ]
            );

            res.status(201).json(resultado.rows[0]);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                mensaje: "Error creando la fase."
            });

        }

    }
);


// ===============================
// PUT /fases/:id
// ===============================
router.put(
    "/:id",
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const { nombre, categoriaId } = req.body;

            if (!nombre || !categoriaId) {
                return res.status(400).json({
                    mensaje: "Datos incompletos."
                });
            }

            const ligaId = req.usuario.liga_id;

            // Verificar que la categoría pertenezca a la liga
            const categoria = await pool.query(
                `
                SELECT id
                FROM categorias
                WHERE
                    id = $1
                    AND liga_id = $2
                    AND activa = TRUE;
                `,
                [categoriaId, ligaId]
            );

            if (categoria.rows.length === 0) {
                return res.status(403).json({
                    mensaje: "La categoría no pertenece a tu liga."
                });
            }

            const resultado = await pool.query(
                `
                UPDATE fases
                SET
                    nombre = $1,
                    categoria_id = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING
                    id,
                    nombre,
                    categoria_id AS "categoriaId",
                    orden;
                `,
                [
                    nombre,
                    categoriaId,
                    id
                ]
            );

            if (resultado.rows.length === 0) {
                return res.status(404).json({
                    mensaje: "Fase no encontrada."
                });
            }

            res.json({
                mensaje: "Fase actualizada correctamente.",
                fase: resultado.rows[0]
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                mensaje: "Error actualizando fase."
            });

        }

    }
);


// ===============================
// DELETE /fases/:id
// ===============================
router.delete(
    "/:id",
    verificarToken,
    soloAdmin,
    async (req,res)=>{

        try{

            const id = Number(req.params.id);

            const resultado = await pool.query(`
                DELETE FROM fases
                WHERE id = $1
                RETURNING *;
            `,[id]);

            if(resultado.rows.length===0){

                return res.status(404).json({
                    mensaje:"Fase no encontrada."
                });

            }

            res.json({
                mensaje:"Fase eliminada correctamente."
            });

        }catch(error){

            console.error(error);

            res.status(500).json({
                mensaje:"Error eliminando fase."
            });

        }

    }
);

module.exports = router;