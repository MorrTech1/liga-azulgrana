let jugadoresCache = [];
let equiposCache = [];
let categoriasCache = [];
let partidosResultadoCache = [];
let partidoSeleccionado = null;

let token = '';
const tokenGuardado = localStorage.getItem('token');
if (tokenGuardado) {
  token = tokenGuardado;
}

// =======================
// LOGIN
// =======================
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        mostrarPanelAdmin(); 
      } else {
        alert('Credenciales incorrectas');
      }
    });
}


document.addEventListener('DOMContentLoaded', () => {
  mostrarSeccion('Categorias');
});



function mostrarLogin() {
  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('adminLayout').style.display = 'none';
}



function mostrarPanelAdmin() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  
  cargarEquipos();
  cargarPartidos();
  cargarJugadores();
  cargarCategorias();
  cargarCategoriasCache();
  cargarEquiposCache();
  cargarJugadoresCache();
}
function obtenerNombreEquipo(equipoId) {
  const equipo = equiposCache.find(e => Number(e.id) === Number(equipoId));
  return equipo ? equipo.nombre : 'Equipo desconocido';
}

function obtenerNombreCategoria(categoriaId) {
  const categoria = categoriasCache.find(c => Number(c.id) === Number(categoriaId));
  return categoria ? categoria.nombre : 'Sin categoría';
}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (token) {
    mostrarPanelAdmin();
  } else {
    mostrarLogin(); // 👈 aquí estaba el fallo
  }
});


function mostrarSeccion(nombre) {

  document.querySelectorAll('.seccion-admin')
    .forEach(sec => sec.style.display = 'none');

  document
    .getElementById(`seccion${nombre}`).style.display = 'block';
    
  // cerrar sidebar en móvil
  const sidebar = document.getElementById('adminSidebar');
  if (window.innerWidth < 768) {
    sidebar.classList.remove('activa');
  }
}

function toggleSidebar() {
  document
    .getElementById('adminSidebar')
    .classList.toggle('activa');
}


function crearBuscador(input, lista, data, onSelect) {
  if (!input || !lista) {
    console.error('Input o lista no encontrados');
    return;
  }

  input.addEventListener('input', () => {
    const texto = input.value.toLowerCase();
    lista.innerHTML = '';

    if (!texto) return;

    data
      .filter(item => item.nombre.toLowerCase().includes(texto))
      .forEach(item => {
        const div = document.createElement('div');
        div.classList.add('item-buscador');

        let textoItem = item.nombre;

        // 🟢 CASO 1: JUGADOR → Equipo + Categoría
        if (item.equipoId) {
          const equipo = equiposCache.find(e => Number(e.id) === Number(item.equipoId));
          const categoria = categoriasCache.find(c => Number(c.id) === Number(item.categoriaId));

          const nombreEquipo = equipo ? equipo.nombre : 'Equipo desconocido';
          const nombreCategoria = categoria ? categoria.nombre : 'Sin categoría';

          textoItem = `${item.nombre} — ${nombreEquipo} (${nombreCategoria})`;
        }

        // 🟢 CASO 2: EQUIPO → Categoría
        else if (item.categoriaId) {
          const categoria = categoriasCache.find(c => Number(c.id) === Number(item.categoriaId));
          const nombreCategoria = categoria ? categoria.nombre : 'Sin categoría';

          textoItem = `${item.nombre} (${nombreCategoria})`;
        }

        div.textContent = textoItem;

        div.onclick = () => {
          input.value = item.nombre;
          lista.innerHTML = '';

          // ID genérico
          input.dataset.id = item.id;

          if (onSelect) onSelect(item);
        };

        lista.appendChild(div);
      });
  });
}



async function cargarCategoriasCache() {
  const res = await fetch('/categorias', {
    headers: { Authorization: `Bearer ${token}` }
  });

  categoriasCache = await res.json();
}

async function cargarCategoriasParaResultado() {
  const select = document.getElementById('categoriaResultado');
  if (!select) return;

  select.innerHTML = '<option value="">-- Selecciona una categoría --</option>';

  categoriasCache.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.nombre;
    select.appendChild(option);
  });
}


function cargarCategorias() {
  fetch('/categorias')
    .then(res => res.json())
    .then(categorias => {
      console.log('Categorías cargadas:', categorias);

      // ===== Crear equipo =====
      const categoriaEquipo = document.getElementById('categoriaEquipo');
      if (categoriaEquipo) {
        categoriaEquipo.innerHTML = '';
        categorias.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.nombre;
          categoriaEquipo.appendChild(opt);
        });
      }

      // ===== Crear partido =====
      const categoriaPartido = document.getElementById('categoriaPartido');
      if (categoriaPartido) {
        categoriaPartido.innerHTML = '';
        categorias.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.nombre;
          categoriaPartido.appendChild(opt);
        });
      }

      // ===== Eliminar categoría =====
      const categoriaEliminar = document.getElementById('categoriaEliminar');
      if (categoriaEliminar) {
        categoriaEliminar.innerHTML = '';

        if (categorias.length === 0) {
          const opt = document.createElement('option');
          opt.textContent = 'No hay categorías';
          categoriaEliminar.appendChild(opt);
          return;
        }

        categorias.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.nombre;
          categoriaEliminar.appendChild(opt);
        });
      }
    })
    .catch(err => {
      console.error('Error cargando categorías:', err);
    });
}





function crearCategoria() {
  const nombre = document.getElementById('nombreCategoria').value;

  fetch('/categorias', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nombre })
  })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      alert('Categoría creada');
      cargarCategorias();
    })
    .catch(err => alert(err.message));
}

function eliminarCategoria() {
  const id = document.getElementById('categoriaEliminar').value;

  fetch(`/categorias/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      alert('Categoría eliminada');
      cargarCategorias();
    })
    .catch(err => alert(err.message));
}


// =======================
// CREAR EQUIPO
// =======================

function crearEquipo() {
  const nombre = document.getElementById('nombreEquipo').value;
  const categoriaId = document.getElementById('categoriaEquipo').value;
  const logoInput = document.getElementById('logoEquipo');
  const logo = logoInput.files[0];

  if (!nombre || !categoriaId) {
    alert('Faltan datos');
    return;
  }

  const formData = new FormData();
  formData.append('nombre', nombre);
  formData.append('categoriaId', categoriaId);
  if (logo) formData.append('logo', logo);

  fetch('/equipos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })
    .then(res => res.json())
  .then(data => {
    if (data.mensaje) throw new Error(data.mensaje);
    alert('Equipo creado');
    cargarEquipos();
  })
  .catch(err => {
    console.error(err);
    alert('Error creando equipo');
  });
}

crearBuscador(
  document.getElementById('buscarLocal'),
  document.getElementById('listaLocal'),
  equiposCache,
  equipo => {
    document.getElementById('buscarLocal').dataset.equipoId = equipo.id;
  }
);

crearBuscador(
  document.getElementById('buscarVisitante'),
  document.getElementById('listaVisitante'),
  equiposCache,
  equipo => {
    document.getElementById('buscarVisitante').dataset.equipoId = equipo.id;

  }
);


// =======================
// CREAR PARTIDO
// =======================
async function crearPartido() {
  const localId = document.getElementById('buscarLocal').dataset.equipoId;
  const visitanteId = document.getElementById('buscarVisitante').dataset.equipoId;
  const categoriaId = document.getElementById('categoriaPartido').value;
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;
  const jornada = document.getElementById('jornadaPartido').value;

  // 🔴 VALIDACIÓN FUERTE
  if (!localId || !visitanteId || !categoriaId || !fecha || !jornada) {
    alert('❌ Completa todos los campos y selecciona equipos');
    return;
  }

  const body = {
    localId: Number(localId),
    visitanteId: Number(visitanteId),
    categoriaId: Number(categoriaId),
    fecha,
    hora,
    jornada: Number(jornada)
  };

  console.log('ENVIANDO PARTIDO:', body);

  try {
    const res = await fetch('/partidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.mensaje || 'Error creando partido');
      return;
    }

    alert('✅ Partido creado correctamente');

    // 🔵 limpiar inputs
    document.getElementById('buscarLocal').value = '';
    document.getElementById('buscarVisitante').value = '';
    document.getElementById('buscarLocal').dataset.equipoId = '';
    document.getElementById('buscarVisitante').dataset.equipoId = '';
    document.getElementById('fecha').value = '';
    document.getElementById('hora').value = '';
    document.getElementById('jornadaPartido').value = '';

    // 🔵 recargar calendario
    

  } catch (err) {
    console.error(err);
    alert('❌ Error de conexión');
  }
}


async function cargarJugadoresCache() {
  const res = await fetch('/jugadores', {
    headers: { Authorization: `Bearer ${token}` }
  });
  jugadoresCache = await res.json();
}

async function cargarEquiposCache() {
  const res = await fetch('/equipos', {
    headers: { Authorization: `Bearer ${token}` }
  });
  equiposCache = await res.json();
}

console.log('JUGADORES CACHE:', jugadoresCache);
console.log('EQUIPOS CACHE:', equiposCache);


function cargarEquipos() {
  fetch('/equipos')
    .then(res => res.json())
    .then(equipos => {
      mapaEquipos = {};
      equipos.forEach(e => {
        mapaEquipos[e.id] = e;
      });

      // ===== selects existentes =====
      const selectLocal = document.getElementById('equipoLocal');
      const selectVisitante = document.getElementById('equipoVisitante');
      const selectEliminarEquipo = document.getElementById('equipoEliminar');

      // ===== nuevos selects (jugadores) =====
      const selectEquipoJugador = document.getElementById('equipoJugador');
      const selectEquipoEditarJugador = document.getElementById('equipoEditarJugador');
      
      // limpiar todos si existend
      [
        selectLocal,
        selectVisitante,
        selectEliminarEquipo,
        selectEquipoJugador,
        selectEquipoEditarJugador
      ].forEach(s => {
        if (s) s.innerHTML = '';
      });

      equipos.forEach(e => {
        // crear partido
        if (selectLocal) {
          const opt = document.createElement('option');
          opt.value = e.id;
          opt.textContent = e.nombre;
          selectLocal.appendChild(opt);
        }

        if (selectVisitante) {
          const opt = document.createElement('option');
          opt.value = e.id;
          opt.textContent = e.nombre;
          selectVisitante.appendChild(opt);
        }

        // eliminar equipo
        if (selectEliminarEquipo) {
          const opt = document.createElement('option');
          opt.value = e.id;
          opt.textContent = e.nombre;
          selectEliminarEquipo.appendChild(opt);
        }

        // crear jugador
        if (selectEquipoJugador) {
          const opt = document.createElement('option');
          opt.value = e.id;
          opt.textContent = e.nombre;
          selectEquipoJugador.appendChild(opt);
        }
        
        // editar jugador
        if (selectEquipoEditarJugador) {
          const opt = document.createElement('option');
          opt.value = e.id;
          opt.textContent = e.nombre;
          selectEquipoEditarJugador.appendChild(opt);
        }
      });

      console.log('✅ Equipos cargados en TODOS los selects');
    });
  }

  crearBuscador(
  document.getElementById('buscarEquipoEliminar'),
  document.getElementById('listaEquipoEliminar'),
  equiposCache,
  equipo => {
    document.getElementById('buscarEquipoEliminar').dataset.equipoId = equipo.id;
  }
);

crearBuscador(
  document.getElementById('buscarLocal'),
  document.getElementById('listaLocal'),
  equiposCache,
  equipo => {
    document.getElementById('buscarLocal').dataset.equipoId = equipo.id;
  }
);

crearBuscador(
  document.getElementById('buscarVisitante'),
  document.getElementById('listaVisitante'),
  equiposCache,
  equipo => {
    document.getElementById('buscarVisitante').dataset.equipoId = equipo.id;
  }
);






function cargarJugadores() {
  fetch('/jugadores')
  .then(res => res.json())
  .then(jugadores => {
      const editar = document.getElementById('jugadorEditar');
      const eliminar = document.getElementById('jugadorEliminar');
      const nombreEquipo = mapaEquipos[jugadores.equipoId] || 'Sin equipo';
      

      if (editar) editar.innerHTML = '';
      if (eliminar) eliminar.innerHTML = '';
      
      
      
      jugadores.forEach(j => {
        const texto = `${j.nombre} ${j.equipoId ? `(${mapaEquipos[j.equipoId]?.nombre || 'Sin equipo'})` : ''}`;
        
        if (editar) {
          const opt = document.createElement('option');
          opt.value = j.id;
          opt.textContent = texto;
          editar.appendChild(opt);
        }
        
        if (eliminar) {
          const opt = document.createElement('option');
          opt.value = j.id;
          opt.textContent = texto;
          eliminar.appendChild(opt);
        }
      });
    });
  }

  crearBuscador(
    document.getElementById('buscarJugadorEliminar'),
    document.getElementById('listaJugadorEliminar'),
    jugadoresCache,
    jugador => {
      document.getElementById('buscarJugadorEliminar').dataset.jugadorId = jugador.id;
    }
);


crearBuscador(
  document.getElementById('buscarEquipoEliminar'),
  document.getElementById('listaEquipoEliminar'),
  equiposCache,
  equipo => {
    document.getElementById('buscarEquipoEliminar').dataset.equipoId = equipo.id;
  }
);


async function cargarJornadasPorCategoria(categoriaId) {
  const select = document.getElementById('jornadaResultado');
  if (!select) return;

  select.innerHTML = '<option value="">-- Selecciona una jornada --</option>';
  select.disabled = true;

  if (!categoriaId) return;

  // Traer partidos de esa categoría
  const res = await fetch(`/partidos?categoriaId=${categoriaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const partidos = await res.json();

  // Obtener jornadas únicas
  const jornadas = [...new Set(partidos.map(p => Number(p.jornada)))]
    .filter(j => !isNaN(j))
    .sort((a, b) => a - b);

  if (jornadas.length === 0) return;

  jornadas.forEach(jornada => {
    const option = document.createElement('option');
    option.value = jornada;
    option.textContent = `Jornada ${jornada}`;
    select.appendChild(option);
  });

  select.disabled = false;
}

async function cargarPartidosParaResultado() {
  const select = document.getElementById('partidoId');
  if (!select) return;

  select.innerHTML = '<option value="">-- Selecciona un partido --</option>';
  select.disabled = true;

  if (!categoriaResultadoActual || !jornadaResultadoActual) return;

  const res = await fetch(
    `/partidos?categoriaId=${categoriaResultadoActual}&jornada=${jornadaResultadoActual}&jugado=false`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const partidos = await res.json();
  partidosResultadoCache = partidos;

  if (!Array.isArray(partidos) || partidos.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No hay partidos pendientes';
    select.appendChild(option);
    return;
  }

  partidos.forEach(p => {
    const local = equiposCache.find(e => e.id === p.localId);
    const visitante = equiposCache.find(e => e.id === p.visitanteId);

    const nombreLocal = local ? local.nombre : 'Local';
    const nombreVisitante = visitante ? visitante.nombre : 'Visitante';

    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = `${p.codigo || ''} — ${nombreLocal} vs ${nombreVisitante}`;
    select.appendChild(option);
  });

  select.disabled = false;
}



function eliminarEquipo() {
  const input = document.getElementById('buscarEquipoEliminar');
  
  if (!input) {
    alert('❌ Input de búsqueda no encontrado');
    return;
  }

  const equipoId = input.dataset.equipoId;
  
  console.log('ID EQUIPO A ELIMINAR:', equipoId);
  
  if (!equipoId) {
    alert('❌ Selecciona un equipo de la lista');
    return;
  }

  if (!confirm('¿Seguro que deseas eliminar este equipo?')) return;
  
  fetch(`/equipos/${equipoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'// 🔥 OBLIGATORIO
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.mensaje) {
        alert('✅ ' + data.mensaje);
      } else {
        alert('✅ Equipo eliminado');
      }
      
      // 🔄 limpiar input
      input.value = '';
      input.dataset.equipoId = '';
      
      // 🔄 refrescar datos
      cargarEquiposCache();
      cargarJugadoresCache();
      
      // 🔄 opcional: limpiar lista visual
      const lista = document.getElementById('listaEquipoEliminar');
      if (lista) lista.innerHTML = '';
    })
    .catch(err => {
      console.error('Error eliminando equipo:', err);
      alert('❌ Error al eliminar equipo');
    });
  }

  
  
  function eliminarPartido() {
  if (!partidoSeleccionado) {
    alert('❌ Selecciona un partido');
    return;
  }

  if (!confirm(`¿Eliminar el partido ${partidoSeleccionado.codigo}?`)) return;

  fetch(`/partidos/${partidoSeleccionado.id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(() => {
      alert('✅ Partido eliminado');

      partidoSeleccionado = null;
      cargarPartidosParaResultado(); // refresca lista
    });
}

  

  function crearJugador() {
    const nombre = document.getElementById('nombreJugador').value;
    const equipoId = document.getElementById('equipoJugador').value;
    
    fetch('/jugadores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nombre, equipoId })
  })
  .then(res => res.json())
    .then(() => {
      alert('Jugador creado');
      cargarJugadores();
    });
}




function editarJugador() {
  const jugadorId = document.getElementById('jugadorEditar').value;
  const equipoId = document.getElementById('equipoEditarJugador').value;
  
  fetch(`/jugadores/${jugadorId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ equipoId })
  })
    .then(res => res.json())
    .then(() => {
      alert('Jugador actualizado');
      cargarJugadores();
    });
  }
  
  function eliminarJugador() {
    const jugadorId = document.getElementById('buscarJugadorEliminar').dataset.jugadorId;
    
  if (!jugadorId) {
    alert('❌ Selecciona un jugador');
    return;
  }
  
  if (!confirm('¿Seguro que deseas eliminar este jugador?')) return;
  
  fetch(`/jugadores/${jugadorId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
      alert('✅ Jugador eliminado');
      
      // limpiar
      document.getElementById('buscarJugadorEliminar').value = '';
      document.getElementById('buscarJugadorEliminar').dataset.jugadorId = '';
      
      cargarJugadoresCache(); // refrescar cache
    });
  }
  
  
  let goleadores = [];
  
  function agregarGoleador() {
    const container = document.getElementById('goleadoresContainer');

    const fila = document.createElement('div');
    fila.classList.add('fila-goleador');
    
    fila.innerHTML = `
    <input type="text" class="buscarGoleador" placeholder="Buscar jugador..." />
    <input type="number" class="golesInput" placeholder="Goles" min="1" />
    <div class="lista-buscador"></div>
    `;
    
    const input = fila.querySelector('.buscarGoleador');
    const lista = fila.querySelector('.lista-buscador');
    
    crearBuscador(input, lista, jugadoresCache, jugador => {
      input.dataset.jugadorId = jugador.id;
    });

  container.appendChild(fila);
}


function cargarJugadoresEnSelect(select) {
  fetch('/jugadores')
  .then(res => res.json())
  .then(jugadores => {
      select.innerHTML = '';
      jugadores.forEach(j => {
        const opt = document.createElement('option');
        opt.value = j.id;
        opt.textContent = j.nombre;
        select.appendChild(opt);
      });
    });
}



document.getElementById('categoriaResultado').addEventListener('change', e => {
  categoriaResultadoActual = Number(e.target.value) || null;

  // 🔴 LIMPIEZAS IMPORTANTES
  jornadaResultadoActual = null;
  partidoSeleccionado = null;

  // limpiar jornadas
  const jornadaSelect = document.getElementById('jornadaResultado');
  jornadaSelect.innerHTML = '<option value="">-- Selecciona jornada --</option>';
  jornadaSelect.disabled = true;

  // limpiar partidos
  const partidoSelect = document.getElementById('partidoId');
  partidoSelect.innerHTML = '<option value="">-- Selecciona partido --</option>';
  partidoSelect.disabled = true;

  // ocultar info
  document.getElementById('infoPartido').style.display = 'none';

  if (!categoriaResultadoActual) return;

  // 🔵 cargar jornadas
  cargarJornadasPorCategoria(categoriaResultadoActual);
});


document.getElementById('jornadaResultado').addEventListener('change', e => {
  jornadaResultadoActual = Number(e.target.value) || null;

  // limpiar partido seleccionado
  partidoSeleccionado = null;

  const partidoSelect = document.getElementById('partidoId');
  partidoSelect.innerHTML = '<option value="">-- Selecciona partido --</option>';
  partidoSelect.disabled = true;

  document.getElementById('infoPartido').style.display = 'none';

  if (!jornadaResultadoActual) return;

  // 🔵 cargar partidos
  cargarPartidosParaResultado();
});

document.getElementById('partidoId').addEventListener('change', e => {
  const partidoId = Number(e.target.value);

  partidoSeleccionado = partidosResultadoCache.find(p => p.id === partidoId) || null;

  if (!partidoSeleccionado) {
    document.getElementById('infoPartido').style.display = 'none';
    return;
  }

  mostrarInfoPartido(partidoSeleccionado);
});


function mostrarInfoPartido(partido) {
  const info = document.getElementById('infoPartido');
  const fechaEl = document.getElementById('infoFecha');
  const horaEl = document.getElementById('infoHora');

  if (!partido) {
    info.style.display = 'none';
    return;
  }

  const fecha = new Date(partido.fecha);
  const fechaTexto = fecha.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  let horaTexto = 'Hora no definida';
  if (partido.hora) {
    const [h, m] = partido.hora.split(':');
    const d = new Date();
    d.setHours(h, m);
    horaTexto = d.toLocaleTimeString('es-MX', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  fechaEl.textContent = `📅 ${fechaTexto}`;
  horaEl.textContent = `⏰ ${horaTexto}`;
  info.style.display = 'block';
}


// =======================
// CARGAR PARTIDOS EN SELECT
// =======================
// =======================
// CARGAR PARTIDOS EN SELECT
// =======================
function cargarPartidos() {
  fetch('/partidos')
    .then(res => res.json())
    .then(partidos => {
      
      // ===== Select registrar resultado =====
      const resultadoSelect = document.getElementById('partidoId');
      if (resultadoSelect) {
        resultadoSelect.innerHTML = '';

        partidos.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id; // 🔑 SIEMPRE ID NUMÉRICO
          
          // 👇 mostrar ID humano
          if (p.codigo) {
            opt.textContent = p.codigo;
          } else {
            opt.textContent = `Partido ${p.id}`;
          }

          resultadoSelect.appendChild(opt);
        });
      }
      
      // ===== Select eliminar partido =====
      const eliminarSelect = document.getElementById('partidoEliminar');
      if (eliminarSelect) {
        eliminarSelect.innerHTML = '';

        partidos.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          
          opt.textContent = p.codigo
            ? `${p.codigo} | ${p.fecha} ${p.hora || ''}`
            : `Partido ${p.id} | ${p.fecha} ${p.hora || ''}`;

            eliminarSelect.appendChild(opt);
          });
      }

      // ===== Select editar partido =====
      const editarSelect = document.getElementById('partidoEditar');
      if (editarSelect) {
        editarSelect.innerHTML = '';

        partidos.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          
          opt.textContent = p.codigo
          ? `${p.codigo} | ${p.fecha} ${p.hora || ''}`
          : `Partido ${p.id} | ${p.fecha} ${p.hora || ''}`;
          
          editarSelect.appendChild(opt);
        });
      }
    })
    .catch(err => {
      console.error('Error cargando partidos:', err);
    });
  }

  
  
  
  // =======================
  // REGISTRAR RESULTADO
  // =======================
  function registrarResultado() {
    const partidoId = document.getElementById('partidoId').value;
  const golesLocal = document.getElementById('golesLocal').value;
  const golesVisitante = document.getElementById('golesVisitante').value;
  
  if (!partidoId) {
    alert('Selecciona un partido');
    return;
  }
  
  const goleadores = [];
  
  document.querySelectorAll('.fila-goleador').forEach(fila => {
    const jugadorId = fila.querySelector('.buscarGoleador').dataset.jugadorId;
  const goles = fila.querySelector('.golesInput').value;
  
  if (jugadorId && goles) {
    goleadores.push({
      jugadorId: Number(jugadorId),
      goles: Number(goles)
    });
  }
});


console.log('📤 ENVIANDO GOLEADORES:', goleadores);

fetch(`/partidos/${partidoId}/resultado`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      golesLocal,
      golesVisitante,
      goleadores
    })
  })
    .then(res => res.json())
    .then(data => {
      alert('Resultado registrado');
      document.getElementById('goleadoresContainer').innerHTML = '';
      cargarPartidos();
      
    })
    .catch(err => {
      console.error(err);
      alert('Error registrando resultado');
    });
}





function logout() {
  localStorage.removeItem('token');
  token = '';
  alert('Sesión cerrada');
  location.reload();
}

function editarPartido() {
  const id = document.getElementById('partidoEditar').value;
  const fecha = document.getElementById('editarFecha').value;
  const hora = document.getElementById('editarHora').value;
  
  if (!fecha && !hora) {
    alert('Debes cambiar fecha o hora');
    return;
  }

  fetch(`/partidos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ fecha, hora })
  })
    .then(async res => {
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.mensaje || 'Error editando partido');
      }

      alert('Partido actualizado');
      cargarPartidos();
    })
    .catch(err => alert(err.message));
  }
  
  
  
  window.onload = () => {
    if (token) {
      cargarEquipos();
    cargarJugadores();
    cargarPartidos();
    cargarCategorias();
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await cargarCategoriasCache();
  await cargarEquiposCache();
  await cargarJugadoresCache();

  cargarCategoriasParaResultado();

  // 🔴 ELIMINAR JUGADOR
  crearBuscador(
    document.getElementById('buscarJugadorEliminar'),
    document.getElementById('listaJugadorEliminar'),
    jugadoresCache,
    jugador => {
      document.getElementById('buscarJugadorEliminar').dataset.jugadorId = jugador.id;
      console.log('Jugador seleccionado:', jugador);
    }
  );

  // 🔴 ELIMINAR EQUIPO
  crearBuscador(
    document.getElementById('buscarEquipoEliminar'),
    document.getElementById('listaEquipoEliminar'),
    equiposCache,
    equipo => {
      document.getElementById('buscarEquipoEliminar').dataset.equipoId = equipo.id;
      console.log('Equipo seleccionado:', equipo);
    }
  );
   // Equipo Local
  crearBuscador(
  document.getElementById('buscarLocal'),
  document.getElementById('listaLocal'),
  equiposCache,
  equipo => {
    document.getElementById('buscarLocal').dataset.equipoId = equipo.id;
  }
);
 //equipo visitante
crearBuscador(
  document.getElementById('buscarVisitante'),
  document.getElementById('listaVisitante'),
  equiposCache,
  equipo => {
    document.getElementById('buscarVisitante').dataset.equipoId = equipo.id;
  }
);
});