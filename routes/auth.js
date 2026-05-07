const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// Mostrar login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.sendFile('login.html', { root: './views' });
});

// Procesar login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

  if (!usuario || !bcrypt.compareSync(password, usuario.password)) {
    return res.redirect('/login?error=1');
  }

  req.session.user = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
  res.redirect('/dashboard');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;