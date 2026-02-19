/***********************************
 * VARIABLES GLOBALES (SIEMPRE ARRIBA)
 ***********************************/
let categoriaActual = null;
let equiposMap = {};

/***********************************
 * CARGAR EQUIPOS (MAPA ID → NOMBRE)
 ***********************************/
function cargarEquipos() {
  return fetch('/equipos')
    .then(res => res.json())
    .then(equipos => {
      equiposMap = {};
      equipos.forEach(e => {
        equiposMap[e.id] = e.nombre;
      });
      console.log('🗺️ Equipos cargados:', equiposMap);
    });
}

function renderizarTabsCategorias(categorias) {
  const contenedor = document.getElementById('tabsCategorias');
  contenedor.innerHTML = '';

  categorias.forEach((c, index) => {
    const btn = document.createElement('div');
    btn.className = 'tab-categoria';
    btn.textContent = c.nombre;

    if (index === 0) btn.classList.add('activa');

    btn.onclick = () => {
      document.querySelectorAll('.tab-categoria')
        .forEach(t => t.classList.remove('activa'));

      btn.classList.add('activa');
      categoriaActual = c.id;

      cargarCalendario();
      cargarTablaPosiciones();
      cargarTablaGoleo();
      
    };

    contenedor.appendChild(btn);
  });
}


/***********************************
 * CARGAR CATEGORÍAS (SELECT USUARIO)
 ***********************************/
function cargarCategorias() {
  fetch('/categorias')
    .then(res => res.json())
    .then(categorias => {

      if (!categorias || categorias.length === 0) return;

      // ⭐ crear tabs visuales
      renderizarTabsCategorias(categorias);

      // ⭐ seleccionar primera categoría automáticamente
      categoriaActual = categorias[0].id;

      cargarCalendario();
      cargarTablaPosiciones();
      cargarTablaGoleo();
    })
    .catch(err => console.error('Error cargando categorías:', err));
}

function agruparPorJornada(partidos) {
  const jornadas = {};

  partidos.forEach(p => {
    if (!jornadas[p.jornada]) {
      jornadas[p.jornada] = [];
    }
    jornadas[p.jornada].push(p);
  });

  return jornadas;
}


/***********************************
 * CARGAR CALENDARIO FILTRADO
 ***********************************/
function cargarCalendario() {
  Promise.all([
    fetch(`/partidos?categoriaId=${categoriaActual}`).then(res => res.json()),
    fetch('/equipos').then(res => res.json())
  ])
  .then(([partidos, equipos]) => {

    const contPendientes = document.getElementById('contenedorPendientes');
    const contJugados = document.getElementById('contenedorJugados');

    contPendientes.innerHTML = '';
    contJugados.innerHTML = '';

    // separar jugados y pendientes
    const pendientes = partidos.filter(p => !p.jugado);
    const jugados = partidos.filter(p => p.jugado);

    // agrupar por jornada
    const jornadasPendientes = agruparPorJornada(pendientes);
    const jornadasJugados = agruparPorJornada(jugados);

    // 🔹 pasar equipos a la función que renderiza
    renderizarJornadas(jornadasPendientes, contPendientes, false, equipos);
    renderizarJornadas(jornadasJugados, contJugados, true, equipos);
  })
  .catch(err => console.error('Error cargando calendario:', err));
}


/***********************************
 * RENDERIZAR TABLA DE CALENDARIO
 ***********************************/
function renderizarJornadas(jornadas, contenedor, esJugado, equipos) {
  Object.keys(jornadas)
    .sort((a, b) => a - b)
    .forEach(jornada => {

      const jornadaDiv = document.createElement('div');
jornadaDiv.className = 'jornada-header';
jornadaDiv.innerHTML = `
  <span class="jornada-badge">Jornada ${jornada}</span>
`;
contenedor.appendChild(jornadaDiv);


      jornadas[jornada].forEach(p => {
        const local = equipos.find(e => e.id === p.localId);
        const visitante = equipos.find(e => e.id === p.visitanteId);

        const div = document.createElement('div');
        div.className = 'partido-card';

        div.innerHTML = `
          <div class="partido-fecha">
            ${formatearFechaHumana(p.fecha, p.hora)}
          </div>

          <div class="partido-equipos">
            <div class="equipo">
              <img src="${local?.logo || '/img/default.png'}" class="logo-equipo">
              <span>${local?.nombre || ''}</span>
            </div>

            <span class="vs">
              ${esJugado ? `${p.golesLocal} - ${p.golesVisitante}` : 'VS'}
            </span>

            <div class="equipo">
              <img src="${visitante?.logo || '/img/default.png'}" class="logo-equipo">
              <span>${visitante?.nombre || ''}</span>
            </div>
          </div>
        `;

        contenedor.appendChild(div);
      });
    });
}

/***********************************
 * FORMATEAR FECHA A TEXTO HUMANO
 ***********************************/
function formatearFechaHumana(fecha, hora) {
  const fechaObj = new Date(`${fecha}T${hora || '00:00'}`);
  const hoy = new Date();

  const esHoy =
    fechaObj.toDateString() === hoy.toDateString();

  if (esHoy) {
    return `<strong> HOY ${fechaObj.toLocaleTimeString('es-MX' , {
      hour: 'numeric',
      minute: '2-digit'
    })} </strong>`;
  }

  return fechaObj.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit'
  });
}




function cargarTablaPosiciones() {
  fetch(`/tabla?categoriaId=${categoriaActual}`)
    .then(res => res.json())
    .then(tabla => {
      const tbody = document.getElementById('tablaPosiciones');
      tbody.innerHTML = '';

      tabla.forEach((e, index) => {
        tbody.innerHTML += `
          <tr>
            <td>${index + 1}</td>
            <td class="equipo-col">
${e.logo ? `<img src="${e.logo}" class="logo-equipo">` : ''}${e.nombre}</td>
            <td>${e.PJ}</td>
            <td>${e.PG}</td>
            <td>${e.PE}</td>
            <td>${e.PP}</td>
            <td>${e.GF}</td>
            <td>${e.GC}</td>
            <td>${e.DG}</td>
            <td><strong>${e.Pts}</strong></td>
          </tr>
        `;
      });
    });
}




function cargarTablaGoleo() {
  if (!categoriaActual) return;

  fetch(`/goleo?categoriaId=${categoriaActual}`)
    .then(res => res.json())
    .then(goleadores => {
      const tbody = document.getElementById('tablaGoleo');

      if (!tbody) return;

      tbody.innerHTML = '';

      // Si no hay goleadores
      if (goleadores.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align:center;">
              No hay goles registrados
            </td>
          </tr>
        `;
        return;
      }

      goleadores.forEach((g, index) => {
        tbody.innerHTML += `
          <tr>
            <td>${index + 1}</td>
            <td>${g.jugador}</td>
            <td>${g.equipo}</td>
            <td><strong>${g.goles}</strong></td>
          </tr>
        `;
        console.log('GOLEO:', goleadores);

      });
    })
    
    .catch(err => {
      console.error('Error cargando tabla de goleo:', err);
    });
}


/***********************************
 * EVENTOS DOM (AL FINAL)
 ***********************************/
document.addEventListener('DOMContentLoaded', async () => {
  const select = document.getElementById('categoriaFiltro');

  if (select) {
    select.addEventListener('change', e => {
      categoriaActual = Number(e.target.value);
      console.log('🔄 Categoría cambiada a:', categoriaActual);
      cargarCalendario();
      cargarTablaPosiciones();
      cargarTablaGoleo();
    });
  }

  // Cargar datos iniciales
  await cargarEquipos();
  cargarCategorias();
});
