const pool = require("./db");

async function initDatabase() {
    try {

        

console.log("🗑️ Tabla 'ligas' eliminada.");

        // =======================
// TABLA LIGAS
// =======================

await pool.query(`
    CREATE TABLE IF NOT EXISTS ligas (

        id SERIAL PRIMARY KEY,

        nombre VARCHAR(100) NOT NULL,

        dominio VARCHAR(255) UNIQUE NOT NULL,

        logo TEXT,

        banner TEXT,

        color_primario VARCHAR(20) DEFAULT '#0D2B5B',

        color_secundario VARCHAR(20) DEFAULT '#C9A227',

        telefono VARCHAR(20),

        email VARCHAR(100),

        facebook_url TEXT,

        instagram_url TEXT,

        activa BOOLEAN DEFAULT TRUE,

        administrador_id INTEGER,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    );
`);


// =======================
// LIGA INICIAL
// =======================

const existeLiga = await pool.query(`
    SELECT id
    FROM ligas
    LIMIT 1;
`);

if (existeLiga.rows.length === 0) {

    await pool.query(`
        INSERT INTO ligas (
            nombre,
            dominio
        )
        VALUES (
            'Liga Azulgrana',
            'liga-azulgrana.local'
        );
    `);

    console.log("✅ Liga inicial creada.");

}

console.log("✅ Tabla 'ligas' lista.");

        

        console.log("✅ Tabla 'ligas' lista.");

        // =====================================
        // TABLA USUARIOS
        // =====================================

        await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,

        nombre VARCHAR(100) NOT NULL,

        email VARCHAR(100) UNIQUE NOT NULL,

        password TEXT NOT NULL,

        rol VARCHAR(20) NOT NULL
        CHECK (rol IN( 'Fundador','admin', 'Capturista')),

        liga_id INTEGER,

         activo BOOLEAN DEFAULT TRUE,

         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_usuario_liga
           FOREIGN KEY (liga_id)
           REFERENCES ligas(id)
           ON DELETE SET NULL
);
        `);


        // =====================================
// USUARIO FUNDADOR INICIAL
// =====================================

const existeFundador = await pool.query(`
    SELECT id
    FROM usuarios
    WHERE rol = 'Fundador';
`);

if (existeFundador.rows.length === 0) {

    await pool.query(`
        INSERT INTO usuarios (
            nombre,
            email,
            password,
            rol,
            liga_id
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            NULL
        );
    `, [
        'Fundador',
        'admin@morrtech.com',
        '123456',
        'Fundador'
    ]);

    console.log("✅ Usuario fundador creado.");
}
       
        // =====================================
        // TABLA CATEGORIAS
        // =====================================

        await pool.query(` 
        CREATE TABLE IF NOT EXISTS categorias (
          id SERIAL PRIMARY KEY,

          nombre VARCHAR(100) NOT NULL,

          liga_id INTEGER NOT NULL,

          activa BOOLEAN DEFAULT TRUE,

          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT fk_categoria_liga
            FOREIGN KEY (liga_id)
            REFERENCES ligas(id)
            ON DELETE CASCADE,

          CONSTRAINT categoria_unica
            UNIQUE(nombre, liga_id)
);
        `);

        // =====================================
        // TABLA EQUIPOS
        // =====================================

        await pool.query(` 
            CREATE TABLE IF NOT EXISTS equipos (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,

    escudo TEXT,

    categoria_id INTEGER NOT NULL,

    activo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_equipo_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE CASCADE,

    CONSTRAINT equipo_unico
        UNIQUE(nombre, categoria_id)
);
            `)

            // =====================================
            // TABLA JUGADORES
            // =====================================
            
        await pool.query(` 
          CREATE TABLE IF NOT EXISTS jugadores (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,

    equipo_id INTEGER NOT NULL,

    activo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_jugador_equipo
        FOREIGN KEY (equipo_id)
        REFERENCES equipos(id)
        ON DELETE CASCADE
); `)



      // =====================================
      // TABLA PARTIDOS
      // =====================================

      await pool.query(`
CREATE TABLE IF NOT EXISTS partidos (
    id SERIAL PRIMARY KEY,

    codigo VARCHAR(50) UNIQUE NOT NULL,

    categoria_id INTEGER NOT NULL,

    equipo_local_id INTEGER NOT NULL,

    equipo_visitante_id INTEGER NOT NULL,

    jornada INTEGER NOT NULL,

    fecha DATE,

    hora TIME,

    goles_local INTEGER DEFAULT 0,

    goles_visitante INTEGER DEFAULT 0,

    estado VARCHAR(20) DEFAULT 'Pendiente',

    activo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_partido_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_partido_local
        FOREIGN KEY (equipo_local_id)
        REFERENCES equipos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_partido_visitante
        FOREIGN KEY (equipo_visitante_id)
        REFERENCES equipos(id)
        ON DELETE CASCADE,

    CONSTRAINT equipos_distintos
        CHECK (equipo_local_id <> equipo_visitante_id)
);
`);

            // =====================================
            // TABLA GOLES
            // =====================================

        await pool.query(`CREATE TABLE IF NOT EXISTS goles (
    id SERIAL PRIMARY KEY,

    partido_id INTEGER NOT NULL,

    jugador_id INTEGER NOT NULL,

    cantidad INTEGER NOT NULL CHECK (cantidad > 0),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_gol_partido
        FOREIGN KEY (partido_id)
        REFERENCES partidos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_gol_jugador
        FOREIGN KEY (jugador_id)
        REFERENCES jugadores(id)
        ON DELETE CASCADE
); `)


    } catch (error) {
        console.error("❌ Error creando las tablas:", error);
    }
}

module.exports = initDatabase;