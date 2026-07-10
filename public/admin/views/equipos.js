let equipoEditando = null;


function renderEquipos(lista = equiposCache) {

    const contenedor = document.getElementById("tablaEquipos");

    if (!contenedor) return;

    console.log(contenedor);

    const filas = lista.map(e => `

        <tr>

            <td>

                ${e.escudo
                    ? `<img src="${e.escudo}" class="escudo-tabla">`
                    : "⚽"}

            </td>

            <td>${e.nombre}</td>

            <td>${e.categoria}</td>

            <td>

                <div class="acciones">

                    <button
    class="btn-icon btn-editar"
    onclick="abrirModalEditarEquipo(${e.id})">

    ✏️

</button>

                    <button
    class="btn-icon btn-eliminar"
    onclick="confirmarEliminarEquipo(${e.id})">

    🗑️

</button>

                </div>

            </td>

        </tr>

    `);

    if (lista.length === 0) {

    contenedor.innerHTML = `
        <div class="empty-state">
            <h3>⚽ No hay equipos</h3>
            <p style="color: #666;">Crea tu primer equipo para comenzar.</p>
        </div>
    `;

    return;
}

    contenedor.innerHTML = Table({

        headers: [

            "Escudo",

            "Nombre",

            "Categoría",

            "Acciones"

        ],

        rows: filas

    });

}

 

function cargarEquipos() {
  fetch('/equipos', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
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

    renderEquipos();
  }

function filtrarEquipos(){

    const texto = document
        .getElementById("buscarEquipo")
        .value
        .toLowerCase()
        .trim();

    const filtrados = equiposCache.filter(e =>

        e.nombre.toLowerCase().includes(texto) ||

        e.categoria.toLowerCase().includes(texto)

    );

    renderEquipos(filtrados);

}

  function abrirModalCrearEquipo() {

    const opcionesCategorias = categoriasCache.map(c => `
        <option value="${c.id}">
            ${c.nombre}
        </option>
    `).join("");

    abrirModal({

        titulo: "⚽ Nuevo Equipo",

        contenido: `

            <input
                id="modalNombreEquipo"
                class="input"
                placeholder="Nombre del equipo">

            <select id="modalCategoriaEquipo" class="input">

                ${opcionesCategorias}

            </select>

            <input
                type="file"
                id="modalLogoEquipo"
                accept="image/*">

        `,

        botones: `

            <button
                class="btn-secundario"
                onclick="cerrarModal()">

                Cancelar

            </button>

            <button
                class="btn-crear"
                onclick="crearEquipoDesdeModal()">

                Guardar

            </button>

        `

    });

}

async function crearEquipoDesdeModal() {

    const nombre = document.getElementById("modalNombreEquipo").value.trim();
    const categoriaId = document.getElementById("modalCategoriaEquipo").value;
    const logo = document.getElementById("modalLogoEquipo").files[0];

    if (!nombre || !categoriaId) {
        mostrarToast("Completa todos los campos", "error");
        return;
    }

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("categoriaId", categoriaId);

    if (logo) {
        formData.append("logo", logo);
    }

    try {

        const res = await fetch("/equipos", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.mensaje || "Error creando equipo");
        }

        cerrarModal();

        mostrarToast("Equipo creado correctamente", "success");

        await cargarEquiposCache();
 
        renderEquipos();

    } catch (error) {

        mostrarToast(error.message, "error");

    }

}


async function crearEquipo() {
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
      Authorization: `Bearer ${localStorage.getItem('token')}`
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


function abrirModalEditarEquipo(id){

    equipoEditando = equiposCache.find(e => e.id === id);

    if(!equipoEditando){

        mostrarToast("Equipo no encontrado.","error");

        return;

    }

    const opcionesCategorias = categoriasCache.map(c => `

        <option
            value="${c.id}"
            ${c.id == equipoEditando.categoriaId ? "selected" : ""}>

            ${c.nombre}

        </option>

    `).join("");

    abrirModal({

        titulo:"✏️ Editar Equipo",

        contenido:`

            <input
                id="modalEditarNombreEquipo"
                class="input"
                value="${equipoEditando.nombre}">

            <input
    class="input"
    value="${equipoEditando.categoria}"
    disabled>

            <input
                type="file"
                id="modalEditarLogoEquipo"
                accept="image/*">

        `,

        botones:`

            <button
                class="btn-secundario"
                onclick="cerrarModal()">

                Cancelar

            </button>

            <button
                class="btn-crear"
                onclick="editarEquipoDesdeModal()">

                Guardar

            </button>

        `

    });

}

async function editarEquipoDesdeModal(){

    const nombre = document
        .getElementById("modalEditarNombreEquipo")
        .value
        .trim();

    const logo = document
        .getElementById("modalEditarLogoEquipo")
        .files[0];

    if(!nombre){

        mostrarToast("Escribe un nombre.","error");

        return;

    }

    const formData = new FormData();

    formData.append("nombre",nombre);

    if(logo){

        formData.append("logo",logo);

    }

    try{

        const res = await fetch(

            `/equipos/${equipoEditando.id}`,

            {

                method:"PUT",

                headers:{

                    Authorization:
                    `Bearer ${localStorage.getItem("token")}`

                },

                body:formData

            }

        );

        const data = await res.json();

        if(!res.ok){

            throw new Error(data.mensaje);

        }

        cerrarModal();

        mostrarToast(
            "Equipo actualizado correctamente.",
            "success"
        );

        await cargarEquiposCache();
        renderEquipos();

    }

    catch(error){

        mostrarToast(error.message,"error");

    }

}


function confirmarEliminarEquipo(id){

    const equipo = equiposCache.find(
        e => e.id === id
    );

    abrirModal({

        titulo:"Eliminar equipo",

        contenido:`

            <p style="margin-top:10px;color:#777">

                ¿Seguro que deseas eliminar el equipo
                <b>${equipo.nombre}</b>?

            </p>

            <p style="margin-top:10px;color:#777">

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
                onclick="eliminarEquipo(${id})">

                Eliminar

            </button>

        `

    });

}

async function eliminarEquipo(id){

    try{

        const res = await fetch(

            `/equipos/${id}`,

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
            "Equipo eliminado correctamente.",
            "success"
        );

        await cargarEquiposCache();
        renderEquipos();

    }

    catch(error){

        mostrarToast(error.message,"error");

    }

}
