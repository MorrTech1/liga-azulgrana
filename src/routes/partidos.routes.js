const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const router = express.Router();

const partidosPath = path.join(__dirname, '../data/partidos.json');
const equiposPath = path.join(__dirname, '../data/equipos.json');
const categoriasPath = path.join(__dirname, '../data/categorias.json');
const jugadoresPath = path.join(__dirname, '../data/jugadores.json');

const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

// =======================
// Helpers
// =======================
function leerJSON(ruta) {
  if (!fs.existsSync(ruta)) return [];
  const data = fs.readFileSync(ruta, 'utf-8');
  if (!data) return [];
  return JSON.parse(data);
}

function guardarJSON(ruta, data) {
  fs.writeFileSync(ruta, JSON.stringify(data, null, 2), 'utf-8');
}




// =======================
// GET /partidos
// =======================
router.get('/', verificarToken, soloAdmin, async (req, res) => {
    try {
         
        const jornada = req.query.jornada
    ? Number(req.query.jornada)
    : null;

const jugado = req.query.jugado;


        const ligaId = req.usuario.liga_id;

        const categoriaId = req.query.categoriaId
            ? Number(req.query.categoriaId)
            : null;

        let consulta = `
            SELECT
                p.id,
                p.codigo,
                p.jornada,

                TO_CHAR(p.fecha, 'YYYY-MM-DD') AS fecha,
                TO_CHAR(p.hora, 'HH24:MI') AS hora,

                p.goles_local AS "golesLocal",
                p.goles_visitante AS "golesVisitante",

                p.estado,

                p.categoria_id AS "categoriaId",

                p.equipo_local_id AS "localId",
                local.nombre AS "localNombre",
                local.escudo AS "localLogo",

                p.equipo_visitante_id AS "visitanteId",
                visitante.nombre AS "visitanteNombre",
                visitante.escudo AS "visitanteLogo"

            FROM partidos p

            INNER JOIN categorias c
                ON p.categoria_id = c.id

            INNER JOIN equipos local
                ON p.equipo_local_id = local.id

            INNER JOIN equipos visitante
                ON p.equipo_visitante_id = visitante.id

            WHERE c.liga_id = $1
        `;

        const parametros = [ligaId];

        let indice = 2;

if (categoriaId) {
    consulta += ` AND p.categoria_id = $${indice}`;
    parametros.push(categoriaId);
    indice++;
}

if (jornada) {
    consulta += ` AND p.jornada = $${indice}`;
    parametros.push(jornada);
    indice++;
}

if (jugado === 'false') {
    consulta += ` AND p.estado = 'Pendiente'`;
}

if (jugado === 'true') {
    consulta += ` AND p.estado = 'Jugado'`;
}

        
        consulta += `
            ORDER BY
                p.jornada,
                p.fecha,
                p.hora;
        `;

        const resultado = await pool.query(
            consulta,
            parametros
        );

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error obteniendo partidos."
        });

    }
});

// =======================
// POST /partidos (crear)
// =======================


router.post('/', verificarToken, soloAdmin, async (req, res) => {
    try {

        const ligaId = req.usuario.liga_id;

        const {
            localId,
            visitanteId,
            fecha,
            hora,
            categoriaId,
            jornada
        } = req.body;

        if (
            !localId ||
            !visitanteId ||
            !fecha ||
            !categoriaId ||
            jornada === undefined
        ) {
            return res.status(400).json({
                mensaje: "Datos incompletos."
            });
        }

        // No permitir que un equipo juegue contra sí mismo
        if (Number(localId) === Number(visitanteId)) {
            return res.status(400).json({
                mensaje: "Un equipo no puede jugar contra sí mismo."
            });
        }

        // Verificar que la categoría pertenezca a la liga
        const categoria = await pool.query(
            `
            SELECT
                id,
                nombre
            FROM categorias
            WHERE
                id = $1
                AND liga_id = $2
                AND activa = TRUE;
            `,
            [
                categoriaId,
                ligaId
            ]
        );

        if (categoria.rows.length === 0) {
            return res.status(403).json({
                mensaje: "La categoría no pertenece a tu liga."
            });
        }

        // Verificar equipo local
        const local = await pool.query(
            `
            SELECT
                e.id,
                e.nombre,
                e.categoria_id
            FROM equipos e
            INNER JOIN categorias c
                ON e.categoria_id = c.id
            WHERE
                e.id = $1
                AND e.activo = TRUE
                AND c.liga_id = $2;
            `,
            [
                localId,
                ligaId
            ]
        );

        // Verificar equipo visitante
        const visitante = await pool.query(
            `
            SELECT
                e.id,
                e.nombre,
                e.categoria_id
            FROM equipos e
            INNER JOIN categorias c
                ON e.categoria_id = c.id
            WHERE
                e.id = $1
                AND e.activo = TRUE
                AND c.liga_id = $2;
            `,
            [
                visitanteId,
                ligaId
            ]
        );

        if (
            local.rows.length === 0 ||
            visitante.rows.length === 0
        ) {
            return res.status(403).json({
                mensaje: "Uno o ambos equipos no pertenecen a tu liga."
            });
        }

        // Ambos deben pertenecer a la categoría seleccionada
        if (
            local.rows[0].categoria_id !== Number(categoriaId) ||
            visitante.rows[0].categoria_id !== Number(categoriaId)
        ) {
            return res.status(400).json({
                mensaje: "Los equipos no pertenecen a esa categoría."
            });
        }

        // Verificar que no exista ya ese partido
        const existente = await pool.query(
            `
            SELECT id
            FROM partidos
            WHERE
                categoria_id = $1
                AND jornada = $2
                AND equipo_local_id = $3
                AND equipo_visitante_id = $4;
            `,
            [
                categoriaId,
                jornada,
                localId,
                visitanteId
            ]
        );

        if (existente.rows.length > 0) {
            return res.status(400).json({
                mensaje: "Ese partido ya existe en esa jornada."
            });
        }

        // Generar código
        const codigoCategoria =
            categoria.rows[0].nombre
                .slice(0, 4)
                .toUpperCase();

        const codigo =
            `${codigoCategoria}-J${String(jornada).padStart(2, '0')}-` +
            `${local.rows[0].nombre.slice(0, 3).toUpperCase()}-` +
            `${visitante.rows[0].nombre.slice(0, 3).toUpperCase()}`;

        // Insertar partido
        const resultado = await pool.query(
            `
            INSERT INTO partidos (
                codigo,
                categoria_id,
                equipo_local_id,
                equipo_visitante_id,
                jornada,
                fecha,
                hora
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                codigo,
                categoria_id AS "categoriaId",
                equipo_local_id AS "localId",
                equipo_visitante_id AS "visitanteId",
                jornada,
                fecha,
                hora,
                goles_local AS "golesLocal",
                goles_visitante AS "golesVisitante",
                estado;
            `,
            [
                codigo,
                categoriaId,
                localId,
                visitanteId,
                jornada,
                fecha,
                hora
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {

        console.error(error);

        if (error.code === '23505') {
            return res.status(400).json({
                mensaje: "Ya existe un partido con ese código."
            });
        }

        res.status(500).json({
            mensaje: "Error creando partido."
        });

    }
});

// =======================
// PUT /partidos/:id (editar)
// =======================
// =======================
// PUT /partidos/:id (editar)
// =======================
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {

        const id = Number(req.params.id);

        const {
            fecha,
            hora,
            jornada
        } = req.body;

        const resultado = await pool.query(
            `
            UPDATE partidos
            SET
                fecha = COALESCE($1, fecha),
                hora = COALESCE($2, hora),
                jornada = COALESCE($3, jornada),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING
                id,
                codigo,
                categoria_id AS "categoriaId",
                equipo_local_id AS "localId",
                equipo_visitante_id AS "visitanteId",
                jornada,
                TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
                TO_CHAR(hora, 'HH24:MI') AS hora,
                goles_local AS "golesLocal",
                goles_visitante AS "golesVisitante",
                estado;
            `,
            [
                fecha || null,
                hora || null,
                jornada ?? null,
                id
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Partido no encontrado."
            });
        }s

        res.json({
            mensaje: "Partido actualizado correctamente.",
            partido: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error actualizando partido."
        });

    }
});
// =======================
// PUT /partidos/:id/resultado
// =======================
// =======================
// PUT /partidos/:id/resultado
// =======================
router.put('/:id/resultado', verificarToken, soloAdmin, async (req, res) => {

    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        const partidoId = Number(req.params.id);

        const {
            golesLocal,
            golesVisitante,
            goleadores
        } = req.body;

        // Verificar que el partido exista y aún no esté finalizado
const ligaId = req.usuario.liga_id;

const partido = await client.query(
    `
    SELECT
        p.id,
        p.estado
    FROM partidos p

    INNER JOIN categorias c
        ON p.categoria_id = c.id

    WHERE
        p.id = $1
        AND c.liga_id = $2;
    `,
    [
        partidoId,
        ligaId
    ]
);

if (partido.rows.length === 0) {
    return res.status(404).json({
        mensaje: "El partido no existe o no pertenece a tu liga."
    });
}

if (partido.rows[0].estado === 'Finalizado') {
    return res.status(400).json({
        mensaje: "Este partido ya fue registrado."
    });
}

// Actualizar resultado del partido
await client.query(
    `
    UPDATE partidos
    SET
        goles_local = $1,
        goles_visitante = $2,
        estado = 'Finalizado',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3;
    `,
    [
        golesLocal,
        golesVisitante,
        partidoId
    ]
);

// Eliminar goles previos del partido (por si en el futuro se edita)
await client.query(
    `
    DELETE FROM goles
    WHERE partido_id = $1;
    `,
    [partidoId]
);

// Registrar goleadores
if (Array.isArray(goleadores)) {

    for (const g of goleadores) {

        await client.query(
            `
            INSERT INTO goles (
                partido_id,
                jugador_id,
                cantidad
            )
            VALUES ($1, $2, $3);
            `,
            [
                partidoId,
                g.jugadorId,
                g.goles
            ]
        );

    }

} 

console.log("Resultado registrado correctamente");
console.log({
    partidoId,
    golesLocal,
    golesVisitante,
    goleadores
});


       

        await client.query('COMMIT');

        res.json({
            mensaje: "Resultado registrado correctamente."
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error(error);

        res.status(500).json({
            mensaje: "Error registrando resultado."
        });

    } finally {

        client.release();

    }

});



// =======================
// DELETE /partidos/:id
// =======================


router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {

        const id = Number(req.params.id);
        const ligaId = req.usuario.liga_id;

        // Verificar que el partido pertenezca a la liga del administrador
        const partido = await pool.query(
            `
            SELECT
                p.id
            FROM partidos p

            INNER JOIN categorias c
                ON p.categoria_id = c.id

            WHERE
                p.id = $1
                AND c.liga_id = $2;
            `,
            [
                id,
                ligaId
            ]
        );

        if (partido.rows.length === 0) {
            return res.status(404).json({
                mensaje: "El partido no existe o no pertenece a tu liga."
            });
        }

        const resultado = await pool.query(
            `
            DELETE FROM partidos
            WHERE id = $1
            RETURNING
                id,
                codigo,
                categoria_id AS "categoriaId",
                equipo_local_id AS "localId",
                equipo_visitante_id AS "visitanteId",
                jornada,
                TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
                TO_CHAR(hora, 'HH24:MI') AS hora,
                goles_local AS "golesLocal",
                goles_visitante AS "golesVisitante",
                estado;
            `,
            [id]
        );

        res.json({
            mensaje: "Partido eliminado correctamente.",
            partido: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error eliminando partido."
        });

    }
});

module.exports = router;
