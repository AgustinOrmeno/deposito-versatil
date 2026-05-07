const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Dashboard
// Dashboard
router.get('/dashboard', (req, res) => {
  res.sendFile('productos.html', { root: './views' });
});

// Listar productos (página)
router.get('/productos', (req, res) => {
  res.sendFile('productos.html', { root: './views' });
});

// API: obtener todos los productos
router.get('/api/productos', (req, res) => {
  const { buscar, categoria } = req.query;
  let query = 'SELECT * FROM productos WHERE 1=1';
  const params = [];

  if (buscar) {
    query += ' AND (titulo LIKE ? OR descripcion LIKE ?)';
    params.push(`%${buscar}%`, `%${buscar}%`);
  }
  if (categoria) {
    query += ' AND categoria = ?';
    params.push(categoria);
  }

  query += ' ORDER BY titulo ASC';
  const productos = db.prepare(query).all(...params);
  res.json(productos);
});

// API: obtener un producto
router.get('/api/productos/:id', (req, res) => {
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!producto) return res.status(404).json({ error: 'No encontrado' });
  res.json(producto);
});

// Crear producto
router.post('/api/productos', upload.single('imagen'), (req, res) => {
  const { titulo, descripcion, categoria, cantidad, stock_minimo } = req.body;
  const imagen = req.file ? req.file.filename : null;

  db.prepare(`
    INSERT INTO productos (titulo, descripcion, categoria, cantidad, stock_minimo, imagen)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(titulo, descripcion, categoria, parseInt(cantidad), parseInt(stock_minimo) || 5, imagen);

  res.json({ ok: true });
});

// Editar producto
router.put('/api/productos/:id', upload.single('imagen'), (req, res) => {
  const { titulo, descripcion, categoria, cantidad, stock_minimo } = req.body;
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!producto) return res.status(404).json({ error: 'No encontrado' });

  const imagen = req.file ? req.file.filename : producto.imagen;

  db.prepare(`
    UPDATE productos SET titulo=?, descripcion=?, categoria=?, cantidad=?, stock_minimo=?, imagen=?
    WHERE id=?
  `).run(titulo, descripcion, categoria, parseInt(cantidad), parseInt(stock_minimo), imagen, req.params.id);

  res.json({ ok: true });
});

// Eliminar producto
router.delete('/api/productos/:id', (req, res) => {
  db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;