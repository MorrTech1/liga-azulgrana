const express = require('express');
const fs = require('fs');
const path = require('path');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

const jugadoresPath = path.join(__dirname, '../data/jugadores.json');
const equiposPath = path.join(__dirname, '../data/equipos.json');

function leerJSON(ruta) {
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
}

function guardarJSON(ruta, data) {
  fs.writeFileSync(ruta, JSON.stringify(data, null, 2));
}

// ==============================
// GET jugadores
// ==============================
router.get('/', (req, res) => {
  res.json(leerJSON(jugadoresPath));
});

// ==============================
// POST jugador
// ==============================
router.post('/', verificarToken, soloAdmin, (req, res) => {
  const jugadores = leerJSON(jugadoresPath);
  const equipos = leerJSON(equiposPath);

  const { nombre, equipoId } = req.body;

  if (!nombre || !equipoId) {
    return res.status(400).json({ mensaje: 'Datos incompletos' });
  }

  const equipo = equipos.find(e => e.id === Number(equipoId));
  if (!equipo) {
    return res.status(400).json({ mensaje: 'Equipo no válido' });
  }

  const nuevoJugador = {
    id: jugadores.length ? jugadores[jugadores.length - 1].id + 1 : 1,
    nombre,
    equipoId: Number(equipoId),
    categoriaId: Number(equipo.categoriaId),
    goles: 0
  };

  jugadores.push(nuevoJugador);
  guardarJSON(jugadoresPath, jugadores);

  res.status(201).json(nuevoJugador);
});
// ==============================
// PUT jugador (editar equipo)
// ==============================
router.put('/:id', verificarToken, soloAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { equipoId } = req.body;

  const jugadores = leerJSON(jugadoresPath);
  const equipos = leerJSON(equiposPath);

  const jugador = jugadores.find(j => j.id === id);
  if (!jugador) {
    return res.status(404).json({ mensaje: 'Jugador no encontrado' });
  }

  const equipo = equipos.find(e => e.id === Number(equipoId));
  if (!equipo) {
    return res.status(400).json({ mensaje: 'Equipo no válido' });
  }

  jugador.equipoId = equipo.id;
  jugador.categoriaId = equipo.categoriaId;

  guardarJSON(jugadoresPath, jugadores);

  res.json({ mensaje: 'Jugador actualizado', jugador });
});

// ==============================
// DELETE jugador
// ==============================
router.delete('/:id', verificarToken, soloAdmin, (req, res) => {
  const id = Number(req.params.id);

  const jugadores = leerJSON(jugadoresPath);
  const index = jugadores.findIndex(j => j.id === id);

  if (index === -1) {
    return res.status(404).json({ mensaje: 'Jugador no encontrado' });
  }

  jugadores.splice(index, 1);
  guardarJSON(jugadoresPath, jugadores);

  res.json({ mensaje: 'Jugador eliminado' });
});

module.exports = router;
