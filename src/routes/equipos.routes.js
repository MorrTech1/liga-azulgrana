const express = require('express');
const fs = require('fs');
const path = require('path');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const uploadEquipo = require('../middlewares/uploadEquipo');


const router = express.Router();

const filePath = path.join(__dirname, '../data/equipos.json');
const partidosPath = path.join(__dirname, '../data/partidos.json');

// ===============================
// Helpers
// ===============================
function leerEquipos() {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function guardarEquipos(equipos) {
  fs.writeFileSync(filePath, JSON.stringify(equipos, null, 2));
}

function leerPartidos() {
  return JSON.parse(fs.readFileSync(partidosPath, 'utf-8'));
}

// ===============================
// GET /equipos
// ===============================
router.get('/', (req, res) => {
  const equipos = leerEquipos();
  res.json(equipos);
});

// ===============================
// POST /equipos
// ===============================
router.post(
  '/',
  verificarToken,
  soloAdmin,
  uploadEquipo.single('logo'),
  (req, res) => {

    const equipos = leerEquipos();
     const categorias = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/categorias.json'), 'utf-8')
  );

    const nombre = req.body?.nombre;
    const categoriaId = req.body?.categoriaId;

    console.log('BODY:', req.body);
    console.log('FILE:', req.file);

    if (!nombre || !categoriaId) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    const categoriaExiste = categorias.some(
      c => c.id === Number(categoriaId)
    );

    if (!categoriaExiste) {
      return res.status(400).json({ mensaje: 'Categoría inválida' });
    }

    const logo = req.file
      ? `/uploads/equipos/${req.file.filename}`
      : null;

    const nuevoEquipo = {
      id: Date.now(),
      nombre,
      categoriaId: Number(categoriaId),
      logo
    };

    equipos.push(nuevoEquipo);
    guardarEquipos(equipos);

    res.status(201).json(nuevoEquipo);
  }
);




// ===============================
// DELETE /equipos/:id
// ===============================
router.delete('/:id', verificarToken, soloAdmin, (req, res) => {
  const id = Number(req.params.id);
  const equipos = leerEquipos();
  const partidos = leerPartidos();

  // 🔒 VALIDACIÓN PRO: no borrar si tiene partidos
  const tienePartidos = partidos.some(
    p => p.localId === id || p.visitanteId === id
  );

  if (tienePartidos) {
    return res.status(400).json({
      mensaje: 'No se puede eliminar el equipo porque tiene partidos asociados'
    });
  }

  const index = equipos.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ mensaje: 'Equipo no encontrado' });
  }

  const eliminado = equipos.splice(index, 1);
  guardarEquipos(equipos);

  res.json({
    mensaje: 'Equipo eliminado',
    equipo: eliminado[0]
  });
});

module.exports = router;
