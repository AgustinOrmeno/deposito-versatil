const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./database');
const fs = require('fs');

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));
app.use(session({
  secret: 'deposito-versatil-secret',
  resave: false,
  saveUninitialized: false
}));

// Middleware para verificar login
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Middleware para verificar rol dueño
function requireOwner(req, res, next) {
  if (!req.session.user || req.session.user.rol !== 'dueño') {
    return res.status(403).send('Acceso denegado');
  }
  next();
}

// Crear usuario dueño por defecto si no existe
const usuarioExiste = db.prepare('SELECT * FROM usuarios WHERE email = ?').get('admin@deposito.com');
if (!usuarioExiste) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)').run('Administrador', 'admin@deposito.com', hash, 'dueño');
  console.log('Usuario admin creado: admin@deposito.com / admin123');
}


// Rutas
app.use('/', require('./routes/auth'));
app.use('/', requireLogin, require('./routes/productos'));
app.use('/', requireLogin, require('./routes/movimientos'));
app.use('/', requireLogin, require('./routes/usuarios'));

// Redirigir raíz al dashboard
app.get('/', requireLogin, (req, res) => res.redirect('/dashboard'));

// Ruta para obtener datos de sesión
app.get('/api/sesion', requireLogin, (req, res) => {
  res.json(req.session.user);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});