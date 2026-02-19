const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const usuarios = require('../data/usuarios.json');

const SECRET = 'clave_secreta_super_segura'; // luego va a .env

// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const usuario = usuarios.find(
    u => u.email === email && u.password === password
  );

  if (!usuario) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    SECRET,
    { expiresIn: '2h' }
  );

  res.json({
    mensaje: 'Login exitoso',
    token,
    rol: usuario.rol
  });
});

module.exports = router;
