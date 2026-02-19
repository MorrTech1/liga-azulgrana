const express = require('express');
const fs = require('fs');
const path = require('path');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();
const filePath = path.join(__dirname, '../data/categorias.json');

// helpers
function leerCategorias() {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function guardarCategorias(categorias) {
  fs.writeFileSync(filePath, JSON.stringify(categorias, null, 2));
}

// ===============================
// GET /categorias
// ===============================
router.get('/', (req, res) => {
  const categorias = leerCategorias();
  res.json(categorias);
});

// ===============================
// POST /categorias
// ===============================
router.post('/', verificarToken, soloAdmin, (req, res) => {
  const categorias = leerCategorias();
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ mensaje: 'Nombre requerido' });
  }

  const nuevaCategoria = {
    id: categorias.length ? categorias[categorias.length - 1].id + 1 : 1,
    nombre
  };

  categorias.push(nuevaCategoria);
  guardarCategorias(categorias);

  res.status(201).json(nuevaCategoria);
});

// ===============================
// DELETE /categorias/:id
// ===============================
router.delete('/:id', verificarToken, soloAdmin, (req, res) => {
  const id = Number(req.params.id);
  const categorias = leerCategorias();

  const index = categorias.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ mensaje: 'Categoría no encontrada' });
  }

  categorias.splice(index, 1);
  guardarCategorias(categorias);

  res.json({ mensaje: 'Categoría eliminada' });
});

module.exports = router;
