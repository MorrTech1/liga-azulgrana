require("dotenv").config();

console.log(process.env.DATABASE_URL);

const express = require('express');
const path = require('path');

const app = express();
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../public/uploads/equipos');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = process.env.PORT || 3000;

// RUTAS DE DIRECTORIOS IMPORTANTES

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


// 👇 IMPORTS DE RUTAS
const pool = require('./db');
const initDatabase = require('./initDatabase');
const ligasRoutes = require('./routes/ligas.routes');
const equiposRoutes = require('./routes/equipos.routes');
const partidosRoutes = require('./routes/partidos.routes');
const tablaRoutes = require('./routes/tabla.routes');
const authRoutes = require('./routes/auth.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const jugadoresRoutes = require('./routes/jugadores.routes');
const goleoRoutes = require('./routes/goleo.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const dashboardFundadorRoutes = require('./routes/fundador/dashboard.routes');
const fundadorLigasRoutes = require('./routes/fundador/ligas.routes');
const fasesRoutes = require('./routes/fases.routes');


//  USO DE RUTAS
app.use('/ligas', ligasRoutes);
app.use('/equipos', equiposRoutes);
app.use('/partidos', partidosRoutes);
app.use('/tabla', tablaRoutes);
app.use('/auth', authRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/jugadores', jugadoresRoutes);
app.use('/goleo', goleoRoutes); 
app.use('/usuarios', usuariosRoutes);
app.use('/fases', fasesRoutes);

app.use('/fundador/dashboard', dashboardFundadorRoutes);
app.use('/fundador/ligas', fundadorLigasRoutes);




// Ruta base
app.get('/', (req, res) => {
  res.send('API de Liga de Fútbol funcionando ⚽');
});

app.get('/fundador', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../public/fundador.html'),
  );

  });

async function conectarDB() {
  try {
    const resultado = await pool.query("SELECT NOW()");
    console.log("✅ Conectado a PostgreSQL");
    console.log(resultado.rows[0]);
  } catch (error) {
    console.error("❌ Error al conectar:", error);
  }
}

conectarDB();

initDatabase();



app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});