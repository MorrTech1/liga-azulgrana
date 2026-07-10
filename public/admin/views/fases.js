let fasesCache =  [];
let faseEditando = null;

function renderFases(lista = fasesCache){

    const contenedor = document.getElementById("tablaFases");

    if(!contenedor) return;

    if(lista.length === 0){

        contenedor.innerHTML = `

            <div class="empty-state">

                <h3>🏆 No hay fases</h3>

                <p> 

                    Crea la primera fase de la competencia.

                </p>

            </div>

        `;

        return;

    }

    const filas = lista.map(f => `

        <tr>

            <td>${f.nombre}</td>

            <td>${f.categoria}</td>

            <td>

                <div class="acciones">

                    <button
                        class="btn-icon btn-editar"
                        onclick="abrirModalEditarFase(${f.id})">

                        ✏️

                    </button>

                    <button
                        class="btn-icon btn-eliminar"
                        onclick="confirmarEliminarFase(${f.id})">

                        🗑️

                    </button>

                </div>

            </td>

        </tr>

    `);

    contenedor.innerHTML = Table({

        headers:[

            "Fase",

            "Categoría",

            "Acciones"

        ],

        rows:filas

    });

}

async function cargarFasesCache() {

    const res = await fetch('/fases', {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    });

    fasesCache = await res.json();

    renderFases();

}

function abrirModalCrearFase() {

    const opcionesCategorias = categoriasCache.map(c => `
        <option value="${c.id}">
            ${c.nombre}
        </option>
    `).join("");

    abrirModal({

        titulo: "🏆 Nueva Fase",

        contenido: `

            <div class="form-group">

                <label>Nombre</label>

                <input
                    id="nombreFase"
                    class="input"
                    placeholder="Ej. Fase Regular">

            </div>

            <div class="form-group">

                <label>Categoría</label>

                <select
                    id="categoriaFase"
                    class="input">

                    ${opcionesCategorias}

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
                onclick="crearFase()">

                Guardar

            </button>

        `

    });

}

async function crearFase() {

    const nombre = document.getElementById("nombreFase").value.trim();

    const categoriaId = document.getElementById("categoriaFase").value;

    if (!nombre) {

        alert("Escribe un nombre.");

        return;

    }

    const res = await fetch("/fases", {

        method: "POST",

        headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${localStorage.getItem("token")}`

        },

        body: JSON.stringify({

            nombre,

            categoriaId

        })

    });

    const data = await res.json();

    if (!res.ok) {

        alert(data.mensaje);

        return;

    }

    cerrarModal();

    cargarFasesCache();

}

/////////////
/////////EDITAR FASE 
//////////////////

function abrirModalEditarFase(id){

    faseEditando = fasesCache.find(f => f.id === id);

    if(!faseEditando) return;

    const opcionesCategorias = categoriasCache.map(c => `

        <option
            value="${c.id}"
            ${c.id === faseEditando.categoriaId ? "selected" : ""}>

            ${c.nombre}

        </option>

    `).join("");

    abrirModal({

        titulo:"✏️ Editar Fase",

        contenido:`

            <div class="form-group">

                <label>Nombre</label>

                <input
                    id="editarNombreFase"
                    class="input"
                    value="${faseEditando.nombre}">

            </div>

            <div class="form-group">

                <label>Categoría</label>

                <select
                    id="editarCategoriaFase"
                    class="input">

                    ${opcionesCategorias}

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
                onclick="editarFase()">

                Guardar

            </button>

        `

    });

}


async function editarFase() {

    const nombre = document
        .getElementById("editarNombreFase")
        .value
        .trim();

    const categoriaId = document
        .getElementById("editarCategoriaFase")
        .value;

    if (!nombre) {

        alert("Escribe un nombre.");

        return;

    }

    const res = await fetch(`/fases/${faseEditando.id}`, {

        method: "PUT",

        headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${localStorage.getItem("token")}`

        },

        body: JSON.stringify({

            nombre,
            categoriaId

        })

    });

    const data = await res.json();

    if (!res.ok) {

        alert(data.mensaje);

        return;

    }

    cerrarModal();

    cargarFasesCache();

}


//////////////
//ELIMINAR FASE
///////////////

function confirmarEliminarFase(id){

    const fase = fasesCache.find(f => f.id === id);

    if(!fase) return;

    if(!confirm(`¿Eliminar la fase "${fase.nombre}"?`)){
        return;
    }

    eliminarFase(id);

}

async function eliminarFase(id){

    const res = await fetch(`/fases/${id}`,{

        method:"DELETE",

        headers:{
            Authorization:`Bearer ${localStorage.getItem("token")}`
        }

    });

    const data = await res.json();

    if(!res.ok){

        alert(data.mensaje);

        return;

    }

    cargarFasesCache();

}


function filtrarFases() {

    const texto = document
        .getElementById("buscarFase")
        .value
        .toLowerCase()
        .trim();

    const filtradas = fasesCache.filter(f =>

        f.nombre.toLowerCase().includes(texto) ||

        f.categoria.toLowerCase().includes(texto)

    );

    renderFases(filtradas);

}