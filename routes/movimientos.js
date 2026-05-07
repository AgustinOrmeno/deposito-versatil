const express = require('express');
const router = express.Router();
const db = require('../database');

// API: registrar movimiento
router.post('/api/movimientos', (req, res) => {
  const { producto_id, tipo, cantidad, nota } = req.body;
  const usuario_id = req.session.user.id;

  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(producto_id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  const nuevaCantidad = tipo === 'entrada'
    ? producto.cantidad + parseInt(cantidad)
    : producto.cantidad - parseInt(cantidad);

  if (nuevaCantidad < 0) return res.status(400).json({ error: 'Stock insuficiente' });

  db.prepare('UPDATE productos SET cantidad = ? WHERE id = ?').run(nuevaCantidad, producto_id);
  db.prepare(`
    INSERT INTO movimientos (producto_id, tipo, cantidad, nota, usuario_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(producto_id, tipo, parseInt(cantidad), nota, usuario_id);

  res.json({ ok: true, nuevaCantidad });
});

// API: historial de movimientos
router.get('/api/movimientos/:producto_id', (req, res) => {
  const movimientos = db.prepare(`
    SELECT m.*, u.nombre as usuario_nombre
    FROM movimientos m
    LEFT JOIN usuarios u ON m.usuario_id = u.id
    WHERE m.producto_id = ?
    ORDER BY m.fecha DESC
  `).all(req.params.producto_id);
  res.json(movimientos);
});

module.exports = router;