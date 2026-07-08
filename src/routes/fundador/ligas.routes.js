const express = require('express');
const pool = require('../../db');

const {
    verificarToken,
    soloFundador
} = require('../../middlewares/auth.middleware');

const router = express.Router();


// =======================
// GET /fundador/ligas
// =======================
router.get(
    '/',
    verificarToken,
    soloFundador,
    async (req, res) => {

        try {

            const resultado = await pool.query(`
               SELECT

    l.id,

    l.nombre,

    l.activa,

    u.nombre AS administrador,

    u.email

FROM ligas l

LEFT JOIN usuarios u

ON u.liga_id = l.id

AND u.rol = 'admin'

ORDER BY l.id;
            `);

            res.json(resultado.rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                mensaje: 'Error obteniendo ligas.'
            });

        }

    }
);

router.post(
    '/',
    verificarToken,
    soloFundador,
    async (req, res) => {

        const client = await pool.connect();

        try {

            await client.query('BEGIN');

            const {
                liga,
                administrador
            } = req.body;

            if (!liga?.nombre) {

                await client.query('ROLLBACK');

                return res.status(400).json({
                    mensaje: "Nombre de la liga requerido."
                });

            }

            if (
                !administrador?.nombre ||
                !administrador?.email ||
                !administrador?.password
            ) {

                await client.query('ROLLBACK');

                return res.status(400).json({
                    mensaje: "Datos del administrador incompletos."
                });

            }

            // ============================
            // Generar dominio
            // ============================

            const dominio = liga.nombre
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");

            // ============================
            // Verificar dominio
            // ============================

            const ligaExistente = await client.query(
                `
                SELECT id
                FROM ligas
                WHERE dominio = $1;
                `,
                [dominio]
            );

            if (ligaExistente.rows.length > 0) {

                await client.query('ROLLBACK');

                return res.status(400).json({
                    mensaje: "Ya existe una liga con ese nombre."
                });

            }

            // ============================
            // Verificar correo
            // ============================

            const usuarioExistente = await client.query(
                `
                SELECT id
                FROM usuarios
                WHERE email = $1;
                `,
                [administrador.email]
            );

            if (usuarioExistente.rows.length > 0) {

                await client.query('ROLLBACK');

                return res.status(400).json({
                    mensaje: "Ese correo ya está registrado."
                });

            }

            // ============================
            // Crear liga
            // ============================

            const nuevaLiga = await client.query(
                `
                INSERT INTO ligas (

                    nombre,
                    dominio

                )
                VALUES (

                    $1,
                    $2

                )
                RETURNING *;
                `,
                [
                    liga.nombre,
                    dominio
                ]
            );

            const ligaId = nuevaLiga.rows[0].id;

            // ============================
            // Crear administrador
            // ============================

            const nuevoAdministrador = await client.query(
                `
                INSERT INTO usuarios (

                    nombre,
                    email,
                    password,
                    rol,
                    liga_id

                )
                VALUES (

                    $1,
                    $2,
                    $3,
                    'admin',
                    $4

                )
                RETURNING
                    id,
                    nombre,
                    email,
                    rol,
                    liga_id;
                `,
                [

                    administrador.nombre,
                    administrador.email,
                    administrador.password,
                    ligaId

                ]
            );

            await client.query('COMMIT');

            res.status(201).json({

                mensaje: "Liga creada correctamente.",

                liga: nuevaLiga.rows[0],

                administrador: nuevoAdministrador.rows[0]

            });

        } catch (error) {

            await client.query('ROLLBACK');

            console.error(error);

            res.status(500).json({
                mensaje: "Error creando la liga."
            });

        } finally {

            client.release();

        }

    }
);

router.put(
    '/:id',
    verificarToken,
    soloFundador,
    async (req, res) => {

        try {

            const id = Number(req.params.id);

            const {
                nombre
            } = req.body;

            if (!nombre) {

                return res.status(400).json({

                    mensaje:"Nombre requerido."

                });

            }

            const dominio = nombre
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/\s+/g,"-")
                .replace(/[^a-z0-9-]/g,"");

            const resultado = await pool.query(

                `
                UPDATE ligas

                SET

                    nombre=$1,

                    dominio=$2,

                    updated_at=CURRENT_TIMESTAMP

                WHERE id=$3

                RETURNING *;
                `,

                [

                    nombre,

                    dominio,

                    id

                ]

            );

            if(resultado.rows.length===0){

                return res.status(404).json({

                    mensaje:"Liga no encontrada."

                });

            }

            res.json({

                mensaje:"Liga actualizada.",

                liga:resultado.rows[0]

            });

        } catch(error){

            console.error(error);

            res.status(500).json({

                mensaje:"Error actualizando."

            });

        }

    }
);

router.put(
    '/:id/estado',
    verificarToken,
    soloFundador,
    async(req,res)=>{

        try{

            const id=Number(req.params.id);

            const resultado=await pool.query(

                `
                UPDATE ligas

                SET

                    activa=NOT activa,

                    updated_at=CURRENT_TIMESTAMP

                WHERE id=$1

                RETURNING *;
                `,

                [id]

            );

            if(resultado.rows.length===0){

                return res.status(404).json({

                    mensaje:"Liga no encontrada."

                });

            }

            res.json({

                mensaje:"Estado actualizado.",

                liga:resultado.rows[0]

            });

        }catch(error){

            console.error(error);

            res.status(500).json({

                mensaje:"Error."

            });

        }

    }
);

module.exports = router;