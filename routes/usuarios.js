const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// Middleware solo para dueño
function requireOwner(req, res, next) {
  if (!req.session.user || req.session.user.rol !== 'dueño') {
    return res.status(403).send('Acceso denegado');
  }
  next();
}

// Página de usuarios
router.get('/usuarios', requireOwner, (req, res) => {
  res.sendFile('usuarios.html', { root: './views' });
});

// API: listar usuarios
router.get('/api/usuarios', requireOwner, (req, res) => {
  const usuarios = db.prepare('SELECT id, nombre, email, rol FROM usuarios ORDER BY nombre ASC').all();
  res.json(usuarios);
});

// API: crear usuario
router.post('/api/usuarios', requireOwner, (req, res) => {
  const { nombre, email, password, rol } = req.body;

  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existe) return res.status(400).json({ error: 'El email ya está registrado' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)').run(nombre, email, hash, rol);
  res.json({ ok: true });
});

// API: eliminar usuario
router.delete('/api/usuarios/:id', requireOwner, (req, res) => {
  if (parseInt(req.params.id) === req.session.user.id) {
    return res.status(400).json({ error: 'No podés eliminar tu propio usuario' });
  }
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// API: cambiar contraseña
router.put('/api/usuarios/:id/password', requireOwner, (req, res) => {
  const { password } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE usuarios SET password = ? WHERE id = ?').run(hash, req.params.id);
  res.json({ ok: true });
});

module.exports = router;