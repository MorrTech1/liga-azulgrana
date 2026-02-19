const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const equiposPath = path.join(__dirname, '../data/equipos.json');
const partidosPath = path.join(__dirname, '../data/partidos.json');

function leerJSON(ruta) {
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
}

router.get('/', (req, res) => {
  const categoriaId = Number(req.query.categoriaId);

  if (!categoriaId) {
    return res.status(400).json({ mensaje: 'categoriaId requerido' });
  }

  const equipos = leerJSON(equiposPath)
    .filter(e => Number(e.categoriaId) === categoriaId);

  const partidos = leerJSON(partidosPath)
    .filter(p =>
      Number(p.categoriaId) === categoriaId &&
      p.jugado === true
    );

  const tabla = {};

  equipos.forEach(e => {
    tabla[e.id] = {
      equipoId: e.id,
      nombre: e.nombre,
      logo: e.logo || null,
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

    local.GF += p.golesLocal;
    local.GC += p.golesVisitante;

    visitante.GF += p.golesVisitante;
    visitante.GC += p.golesLocal;

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
      local.Pts += 1;
      visitante.Pts += 1;
    }
  });

  Object.values(tabla).forEach(e => {
    e.DG = e.GF - e.GC;
  });

  const resultado = Object.values(tabla).sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    if (b.DG !== a.DG) return b.DG - a.DG;
    return b.GF - a.GF;
  });

  res.json(resultado);
});


module.exports = router;
