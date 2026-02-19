const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const jugadoresPath = path.join(__dirname, '../data/jugadores.json');
const equiposPath = path.join(__dirname, '../data/equipos.json');

// =======================
// Helpers
// =======================
function leerJSON(ruta) {
  if (!fs.existsSync(ruta)) return [];
  const contenido = fs.readFileSync(ruta, 'utf-8');
  if (!contenido) return [];
  return JSON.parse(contenido);
}

// =======================
// GET /goleo?categoriaId=
// =======================
router.get('/', (req, res) => {
  const categoriaId = Number(req.query.categoriaId);

  if (!categoriaId) {
    return res.status(400).json({
      mensaje: 'categoriaId requerido'
    });
  }

  const jugadores = leerJSON(jugadoresPath)
    .filter(j => Number(j.categoriaId) === categoriaId);

  const equipos = leerJSON(equiposPath);

  // Construir tabla de goleo
  const tabla = jugadores.map(j => {
    const equipo = equipos.find(e => e.id === j.equipoId);

    return {
      jugadorId: j.id,
      jugador: j.nombre,
      equipo: equipo ? equipo.nombre : '—',
      goles: j.goles ?? 0
    };
  })
  // solo mostrar jugadores con goles
  .filter(j => j.goles > 0)
  // ordenar por goles
  .sort((a, b) => b.goles - a.goles);

  res.json(tabla);
});

module.exports = router;
