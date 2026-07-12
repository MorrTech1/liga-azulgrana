let jugadoresCache = [];
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
// ============

function login() {

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log("Iniciando login...");

    fetch('/auth/login', {

        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            email,
            password
        })

    })

    .then(async res => {

        console.log("Status:", res.status);

        const data = await res.json();

        console.log("Respuesta:", data);

        if (!res.ok) {
            throw new Error(data.mensaje || "Error iniciando sesión.");
        }

        localStorage.setItem('token', data.token);

        if (data.rol === 'Fundador') {

            window.location.href = '/fundador';

        } else {

            mostrarPanelAdmin();

        }

    })

    .catch(error => {

        console.error(error);

        alert(error.message);

    });

}


document.addEventListener('DOMContentLoaded', () => {
  mostrarSeccion('Categorias');
});



function mostrarLogin() {
  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('adminLayout').style.display = 'none';
}



async function mostrarPanelAdmin() {

    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminLayout').style.display = 'flex';

    await renderCategorias();

    renderEquipos();
    cargarPartidos();
    cargarJugadores();

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
    mostrarLogin(); 
  }
});


function mostrarSeccion(nombre) {

    document.querySelectorAll('.seccion-admin')
        .forEach(sec => sec.style.display = 'none');

    document
        .getElementById(`seccion${nombre}`).style.display = 'block';

    if (nombre === "Categorias") {

        renderCategorias();

    }

    if(nombre === "Equipos"){
        renderEquipos();
}
    if(nombre === "Competencias"){
      cargarFasesCache();
    }

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
        Authorization: `Bearer ${localStorage.getItem('token')}`
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
    cargarPartidos();

  } catch (err) {
    console.error(err);
    alert('❌ Error de conexión');
  }
}




async function cargarEquiposCache() {
  const res = await fetch('/equipos', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  equiposCache = await res.json();
}





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
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }
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
  
  
  function eliminarPartido() {
  if (!partidoSeleccionado) {
    alert('❌ Selecciona un partido');
    return;
  }

  if (!confirm(`¿Eliminar el partido ${partidoSeleccionado.codigo}?`)) return;

  fetch(`/partidos/${partidoSeleccionado.id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(res => res.json())
    .then(() => {
      alert('✅ Partido eliminado');

      partidoSeleccionado = null;
      cargarPartidosParaResultado(); // refresca lista
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
  fetch('/jugadores', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
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

// CARGAR PARTIDOS EN SELECT
// =======================
function cargarPartidos() {
  fetch('/partidos',{
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })  
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
      Authorization: `Bearer ${localStorage.getItem('token')}`
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
      'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    renderEquipos();
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

 
});

