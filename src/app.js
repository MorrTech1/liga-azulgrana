const express = require('express');
const path = require('path');

const app = express();

console.log('APP FILE:', __filename);
console.log('PUBLIC DIR:', path.join(__dirname, '../public'));
console.log('UPLOADS DIR:', path.join(__dirname, '../public/uploads'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 STATIC ABSOLUTO
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// TEST DIRECTO
app.get('/test-upload', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../public/uploads/equipos'),
    err => {
      if (err) res.status(500).send(err.message);
    }
  );
});

app.get('/', (req, res) => {
  res.send('Servidor OK');
});

app.listen(4000, () => {
  console.log('Servidor corriendo en http://localhost:4000');
});

// 👇 IMPORTS DE RUTAS
const ligasRoutes = require('./routes/ligas.routes');
const equiposRoutes = require('./routes/equipos.routes');
const partidosRoutes = require('./routes/partidos.routes');
const tablaRoutes = require('./routes/tabla.routes');
const authRoutes = require('./routes/auth.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const jugadoresRoutes = require('./routes/jugadores.routes');
const goleoRoutes = require('./routes/goleo.routes');


// 👇 USO DE RUTAS
app.use('/ligas', ligasRoutes);
app.use('/equipos', equiposRoutes);
app.use('/partidos', partidosRoutes);
app.use('/tabla', tablaRoutes);
app.use('/auth', authRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/jugadores', jugadoresRoutes);
app.use('/goleo', goleoRoutes); 




// Ruta base
app.get('/', (req, res) => {
  res.send('API de Liga de Fútbol funcionando ⚽');
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
