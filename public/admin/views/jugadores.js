let jugadorEditando = null; 




function renderJugadores(lista = jugadoresCache){

    const contenedor = document.getElementById("tablaJugadores");

    if(!contenedor) return;

    if(lista.length === 0){

        contenedor.innerHTML = `
            <div class="empty-state">
                <h3>👤 No hay jugadores</h3>
                <p>Crea tu primer jugador para comenzar.</p>
            </div>
        `;

        return;

    }

    const filas = lista.map(j => `

        <tr>
                
            <td>${j.numero ?? "-"}</td>

            <td>${j.nombre}</td>

            <td>${j.equipo}</td>

            <td>${j.categoria}</td>

            <td>

                <div class="acciones">

                    <button
                        class="btn-icon btn-editar"
                        onclick="abrirModalEditarJugador(${j.id})">

                        ✏️

                    </button>

                    <button
                        class="btn-icon btn-eliminar"
                        onclick="confirmarEliminarJugador(${j.id})">

                        🗑️

                    </button>

                </div>

            </td>

        </tr>

    `);

    contenedor.innerHTML = Table({

        headers:[
            "#",
            "Nombre",
            "Equipo",
            "Categoría",
            "Acciones"
        ],

        rows:filas

    });

}




async function cargarJugadoresCache() {
  const res = await fetch('/jugadores', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  jugadoresCache = await res.json();

    renderJugadores();
}



function cargarJugadores() {
  fetch('/jugadores', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
  .then(res => res.json())
  .then(jugadores => {

      const editar = document.getElementById('jugadorEditar');
      const eliminar = document.getElementById('jugadorEliminar');

      if (editar) editar.innerHTML = '';
      if (eliminar) eliminar.innerHTML = '';

      jugadores.forEach(j => {

        const texto = `${j.nombre} — ${j.equipo} (${j.categoria})`;

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

function abrirModalCrearJugador() {

    const opcionesEquipos = equiposCache.map(e => `
        <option value="${e.id}">
            ${e.nombre}
            (${e.categoria})
        </option>
    `).join("");

    abrirModal({

        titulo: "Nuevo jugador",

        contenido: `

            <div class="form-modal">

                <label>Nombre</label>

                <input
                    id="nombreJugadorModal"
                    type="text"
                    placeholder="Nombre del jugador">

                <label>Número</label>

                <input
                    id="numeroJugadorModal"
                    type="number"
                    min="1"
                    max="99"
                    placeholder="10">

                <label>Equipo</label>

                <select id="equipoJugadorModal">

                    ${opcionesEquipos}

                </select>

            </div>

        `,

        botones: `

            <button
                class="btn-secundario"
                onclick="cerrarModal()">

                Cancelar

            </button>

            <button
                class="btn-crear"
                onclick="crearJugadorDesdeModal()">

                Guardar

            </button>

        `

    });

}

async function crearJugadorDesdeModal() {

    const nombre = document
        .getElementById("nombreJugadorModal")
        .value
        .trim();

    const numero = Number(
        document.getElementById("numeroJugadorModal").value
    );

    const equipoId = document
        .getElementById("equipoJugadorModal")
        .value;

    if (!nombre) {

        mostrarToast("Ingresa el nombre del jugador.", "warning");
        return;

    }

    if (numero < 1 || numero > 99) {

        mostrarToast(
            "El número debe estar entre 1 y 99.",
            "warning"
        );

        return;

    }

    try {

        const res = await fetch("/jugadores", {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                Authorization:
                    `Bearer ${localStorage.getItem("token")}`

            },

            body: JSON.stringify({

                nombre,
                numero,
                equipoId

            })

        });

        const data = await res.json();

        if (!res.ok) {

            throw new Error(data.mensaje);

        }

        cerrarModal();

        mostrarToast(
            "Jugador creado correctamente.",
            "success"
        );

        await cargarJugadoresCache();

    }

    catch (error) {

        mostrarToast(
            error.message,
            "error"
        );

    }

}

 function crearJugador() {
    const nombre = document.getElementById('nombreJugador').value;
    const equipoId = document.getElementById('equipoJugador').value;
    const numero = document.getElementById('numeroJugador').value;
    
    fetch('/jugadores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ nombre, numero, equipoId })
  })
  .then(res => res.json())
    .then(() => {
      alert('Jugador creado');
      cargarJugadores();
    });
}

function abrirModalEditarJugador(id){

    jugadorEditando = jugadoresCache.find(
        j => j.id === id
    );

    const opcionesEquipos = equiposCache.map(e => `

        <option
            value="${e.id}"
            ${e.id == jugadorEditando.equipoId ? "selected" : ""}>

            ${e.nombre}
           (${e.categoria})

        </option>

    `).join("");

    abrirModal({

        titulo:"Editar jugador",

        contenido:`

            <div class="form-modal">

                <label>Nombre</label>

                <input
                    id="editarNombreJugador"
                    value="${jugadorEditando.nombre}">

                <label>Número</label>

                <input
                    id="editarNumeroJugador"
                    type="number"
                    min="1"
                    max="99"
                    value="${jugadorEditando.numero}">

                <label>Equipo</label>

                <select id="editarEquipoJugador">

                    ${opcionesEquipos}

                </select>

            </div>

        `,

        botones:`

            <button
                class="btn-secundario"
                onclick="cerrarModal()">

                Cancelar

            </button>

            <button
                class="btn-crear"
                onclick="editarJugadorDesdeModal(${id})">

                Guardar

            </button>

        `

    });

}

async function editarJugadorDesdeModal() {

    const nombre = document
        .getElementById("editarNombreJugador")
        .value
        .trim();

    const numero = Number(
        document.getElementById("editarNumeroJugador").value
    );

    const equipoId = document
        .getElementById("editarEquipoJugador").value;

    if (!nombre) {

        mostrarToast(
            "Ingresa el nombre del jugador.",
            "warning"
        );

        return;

    }

    if (numero < 1 || numero > 99) {

        mostrarToast(
            "El número debe estar entre 1 y 99.",
            "warning"
        );

        return;

    }

    try {

        const res = await fetch(

            `/jugadores/${jugadorEditando.id}`,

            {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json",

                    Authorization:
                        `Bearer ${localStorage.getItem("token")}`

                },

                body: JSON.stringify({

                    nombre,
                    numero,
                    equipoId

                })

            }

        );

        const data = await res.json();

        if (!res.ok) {

            throw new Error(data.mensaje);

        }

        cerrarModal();

        mostrarToast(
            "Jugador actualizado correctamente.",
            "success"
        );

        await cargarJugadoresCache();

    }

    catch (error) {

        mostrarToast(
            error.message,
            "error"
        );

    }

}


function editarJugador() {
  const jugadorId = document.getElementById('jugadorEditar').value;
  const equipoId = document.getElementById('equipoEditarJugador').value;
  
  fetch(`/jugadores/${jugadorId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ equipoId })
  })
    .then(res => res.json())
    .then(() => {
      alert('Jugador actualizado');
      cargarJugadores();
    });
  }

  /////////////////////////
  ////ELIMINAR JUGADOR/////
  /////////////////////////

  function confirmarEliminarJugador(id){

    const jugador = jugadoresCache.find(
        j => j.id === id
    );

    abrirModal({

        titulo:"Eliminar jugador",

        contenido:`

            <p style="margin-top:10px;color:#777;">

                ¿Seguro que deseas eliminar al jugador
                <b>${jugador.nombre}</b>?

            </p>

            <p style="margin-top:10px;color:#777;">

                Esta acción no se puede deshacer.

            </p>

        `,

        botones:`

            <button
                class="btn-secundario"
                onclick="cerrarModal()">

                Cancelar

            </button>

            <button
                class="btn-eliminar"
                onclick="eliminarJugador(${id})">

                Eliminar

            </button>

        `

    });

}
  
  async function eliminarJugador(id){

    try{

        const res = await fetch(

            `/jugadores/${id}`,

            {

                method:"DELETE",

                headers:{

                    Authorization:
                    `Bearer ${localStorage.getItem("token")}`

                }

            }

        );

        const data = await res.json();

        if(!res.ok){

            throw new Error(data.mensaje);

        }

        cerrarModal();

        mostrarToast(
            "Jugador eliminado correctamente.",
            "success"
        );

        await cargarJugadoresCache();

    }

    catch(error){

        mostrarToast(
            error.message,
            "error"
        );

    }

}


function filtrarJugadores(){

    const texto = document
        .getElementById("buscarJugador")
        .value
        .toLowerCase()
        .trim();

    const filtrados = jugadoresCache.filter(j =>

        j.nombre.toLowerCase().includes(texto) ||

        j.equipo.toLowerCase().includes(texto) ||

        j.categoria.toLowerCase().includes(texto) ||

        String(j.numero).includes(texto)

    );

    renderJugadores(filtrados);

}