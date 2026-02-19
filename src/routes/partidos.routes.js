const express = require('express');
const fs = require('fs');
const path = require('path');

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
router.get('/', (req, res) => {
  const categoriaId = req.query.categoriaId
    ? Number(req.query.categoriaId)
    : null;

  let partidos = leerJSON(partidosPath);
  const equipos = leerJSON(equiposPath);

  if (categoriaId) {
    partidos = partidos.filter(p => p.categoriaId === categoriaId);
  }

  const resultado = partidos.map(p => {
    const local = equipos.find(e => e.id === p.localId);
    const visitante = equipos.find(e => e.id === p.visitanteId);

    return {
      ...p,
      localNombre: local ? local.nombre : '—',
      visitanteNombre: visitante ? visitante.nombre : '—',
      localLogo: local ? local.logo : null,
      visitanteLogo: visitante ? visitante.logo : null
    };
  });

  res.json(resultado);
});

// =======================
// POST /partidos (crear)
// =======================
router.post('/', verificarToken, soloAdmin, (req, res) => {
  const partidos = leerJSON(partidosPath);
  const equipos = leerJSON(equiposPath);
  const categorias = leerJSON(categoriasPath);

  const { localId, visitanteId, fecha, hora, categoriaId, jornada } = req.body;

  if (!localId || !visitanteId || !fecha || !categoriaId || jornada === undefined) {
    return res.status(400).json({ mensaje: 'Datos incompletos' });
  }

  const categoria = categorias.find(c => c.id === Number(categoriaId));
  if (!categoria) {
    return res.status(400).json({ mensaje: 'Categoría no válida' });
  }

  const local = equipos.find(e => e.id === Number(localId));
  const visitante = equipos.find(e => e.id === Number(visitanteId));
  if (!local || !visitante) {
    return res.status(400).json({ mensaje: 'Equipo no encontrado' });
  }

  const nuevoId =
    partidos.length > 0
      ? Math.max(...partidos.map(p => Number(p.id))) + 1
      : 1;

  const codigoCategoria =
    categoria.codigo || categoria.nombre.slice(0, 4).toUpperCase();

  const codigo = `${codigoCategoria}-J${String(jornada).padStart(2, '0')}-${local.nombre.slice(0,3).toUpperCase()}-${visitante.nombre.slice(0,3).toUpperCase()}`;

  const nuevoPartido = {
    id: nuevoId,
    codigo,
    jornada: Number(jornada),
    localId: Number(localId),
    visitanteId: Number(visitanteId),
    fecha,
    hora,
    categoriaId: Number(categoriaId),
    jugado: false
  };

  partidos.push(nuevoPartido);
  guardarJSON(partidosPath, partidos);

  res.status(201).json(nuevoPartido);
});

// =======================
// PUT /partidos/:id (editar)
// =======================
router.put('/:id', verificarToken, soloAdmin, (req, res) => {
  const partidos = leerJSON(partidosPath);
  const id = Number(req.params.id);

  const partido = partidos.find(p => p.id === id);
  if (!partido) {
    return res.status(404).json({ mensaje: 'Partido no encontrado' });
  }

  const { fecha, hora, jornada } = req.body;

  if (fecha) partido.fecha = fecha;
  if (hora) partido.hora = hora;
  if (jornada !== undefined) partido.jornada = Number(jornada);

  guardarJSON(partidosPath, partidos);

  res.json({ mensaje: 'Partido actualizado' });
});

// =======================
// PUT /partidos/:id/resultado
// =======================
router.put('/:id/resultado', verificarToken, soloAdmin, (req, res) => {
  console.log('🔥 ENTRO A REGISTRAR RESULTADO');
  console.log('BODY COMPLETO', req.body);


  const partidos = leerJSON(partidosPath);
  const jugadores = leerJSON(jugadoresPath);

  console.log('JUGADORES ANTES:', jugadores);

  const partidoId = Number(req.params.id);
  const { golesLocal, golesVisitante, goleadores } = req.body;

  console.log('GOLEADORES RECIBIDOS:', goleadores);

  const partido = partidos.find(p => p.id === partidoId);
  if (!partido) {
    return res.status(404).json({ mensaje: 'Partido no encontrado' });
  }

  if (partido.jugado) {
    return res.status(400).json({ mensaje: 'Este partido ya fue registrado' });
  }

  partido.golesLocal = Number(golesLocal);
  partido.golesVisitante = Number(golesVisitante);
  partido.jugado = true;

  if (Array.isArray(goleadores)) {
    goleadores.forEach(g => {
      const jugador = jugadores.find(j => Number(j.id) === Number(g.jugadorId));
      if (jugador) {
        jugador.goles = Number(jugador.goles || 0) + Number(g.goles);
      }
    });
  }

  console.log('JUGADORES DESPUÉS:', jugadores);

  guardarJSON(partidosPath, partidos);
  guardarJSON(jugadoresPath, jugadores);

  res.json({ mensaje: 'Resultado registrado correctamente' });
});

// =======================
// DELETE /partidos/:id
// =======================
router.delete('/:id', verificarToken, soloAdmin, (req, res) => {
  const partidos = leerJSON(partidosPath);
  const id = Number(req.params.id);

  const filtrados = partidos.filter(p => p.id !== id);

  if (filtrados.length === partidos.length) {
    return res.status(404).json({ mensaje: 'Partido no encontrado' });
  }

  guardarJSON(partidosPath, filtrados);

  res.json({ mensaje: 'Partido eliminado' });
});

module.exports = router;
