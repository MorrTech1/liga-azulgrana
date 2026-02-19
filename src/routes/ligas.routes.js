const express = require('express');
const router = express.Router();
const ligas = require('../data/ligas.json');

// Obtener todas las ligas
router.get('/', (req, res) => {
  res.json(ligas);
});

// Crear una liga (simulado)
router.post('/', (req, res) => {
  const nuevaLiga = req.body;

  res.status(201).json({
    mensaje: 'Liga creada correctamente',
    liga: nuevaLiga
  });
});

module.exports = router;
