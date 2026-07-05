const express = require('express');
const pool = require('../db');
const router = express.Router();


router.get('/',  async (req, res) => {

    try {

        const ligaId = req.usuario.liga_id;

        const categoriaId = Number(req.query.categoriaId);

        if (!categoriaId) {
            return res.status(400).json({
                mensaje: 'categoriaId requerido'
            });
        }

        // Obtener equipos
        const equiposResultado = await pool.query(
            `
           SELECT
    e.id,
    e.nombre,
    e.escudo AS logo
FROM equipos e

INNER JOIN categorias c
    ON e.categoria_id = c.id

WHERE
    e.categoria_id = $1
    AND c.liga_id = $2
    AND e.activo = TRUE;
            `,
            [categoriaId, ligaId]
        );

        // Obtener partidos finalizados
        const partidosResultado = await pool.query(
            `
             SELECT
    p.equipo_local_id AS "localId",
    p.equipo_visitante_id AS "visitanteId",
    p.goles_local AS "golesLocal",
    p.goles_visitante AS "golesVisitante"

FROM partidos p

INNER JOIN categorias c
    ON p.categoria_id = c.id

WHERE
    p.categoria_id = $1
    AND c.liga_id = $2
    AND p.estado = 'Finalizado';
            `,
            [categoriaId, ligaId]
        );

        const equipos = equiposResultado.rows;
        const partidos = partidosResultado.rows;

        const tabla = {};

        equipos.forEach(e => {

            tabla[e.id] = {
                equipoId: e.id,
                nombre: e.nombre,
                logo: e.logo,

                PJ: 0,
                PG: 0,
                PE: 0,
                PP: 0,

                GF: 0,
                GC: 0,
                DG: 0,

                Pts: 0
            };

        });

        partidos.forEach(p => {

            const local = tabla[p.localId];
            const visitante = tabla[p.visitanteId];

            if (!local || !visitante) return;

            local.PJ++;
            visitante.PJ++;

            local.GF += Number(p.golesLocal);
            local.GC += Number(p.golesVisitante);

            visitante.GF += Number(p.golesVisitante);
            visitante.GC += Number(p.golesLocal);

            if (p.golesLocal > p.golesVisitante) {

                local.PG++;
                visitante.PP++;

                local.Pts += 3;

            } else if (p.golesLocal < p.golesVisitante) {

                visitante.PG++;
                local.PP++;

                visitante.Pts += 3;

            } else {

                local.PE++;
                visitante.PE++;

                local.Pts++;
                visitante.Pts++;

            }

        });

        Object.values(tabla).forEach(e => {
            e.DG = e.GF - e.GC;
        });

       const resultado = Object.values(tabla).sort((a, b) => {

    if (b.Pts !== a.Pts)
        return b.Pts - a.Pts;

    // Priorizar al que ya disputó más partidos
    if (b.PJ !== a.PJ)
        return b.PJ - a.PJ;

    if (b.DG !== a.DG)
        return b.DG - a.DG;

    return b.GF - a.GF;

});

        res.json(resultado);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error obteniendo tabla.'
        });

    }

});


module.exports = router;
