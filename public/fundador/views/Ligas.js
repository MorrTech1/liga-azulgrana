// ==========================================
// LIGAS
// ==========================================

async function mostrarligas(){

    const res = await fetch('/fundador/ligas',{

        headers:{
            Authorization:`Bearer ${localStorage.getItem('token')}`
        }

    });

    const ligas = await res.json();

    const filas = ligas.map(l=>`

        <tr>

            <td>${l.id}</td>

            <td>${l.nombre}</td>

            <td>

                ${
                    l.activa
                    ? '<span class="badge badge-success">Activa</span>'
                    : '<span class="badge badge-danger">Suspendida</span>'
                }

            </td>

            <td>

                <button
                    class="btn btn-primary"
                    onclick="editarLiga(${l.id})">

                    ✏

                </button>

                <button
                    class="btn btn-danger"
                    onclick="cambiarEstadoLiga(${l.id})">

                    ${l.activa ? "⏸" : "▶"}

                </button>

            </td>

        </tr>

    `);

    cargarVista(`

        <div class="panel">

            <div
                style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:25px;
                ">

                <button
                    class="btn btn-primary"
                    onclick="mostrarFormularioLiga()">

                    + Nueva Liga

                </button>

            </div>

            ${Table({

                headers:[

                    "ID",

                    "Liga",

                    "Estado",

                    "Acciones"

                ],

                rows:filas

            })}

        </div>

    `);

}

async function cambiarEstadoLiga(id){

    if(!confirm("¿Cambiar estado de la liga?"))
        return;

    await fetch(`/fundador/ligas/${id}/estado`,{

        method:"PUT",

        headers:{
            Authorization:`Bearer ${localStorage.getItem('token')}`
        }

    });

    renderLigas();

}

function editarLiga(id){

    alert("Editar liga "+id);

}

function mostrarFormularioLiga() {

    abrirModal({

        titulo: "Nueva Liga",

        contenido: `

            <h3>Información de la Liga</h3>

            <input
                id="nombreNuevaLiga"
                type="text"
                placeholder="Nombre de la liga">

            <hr style="margin:25px 0;">

            <h3>Administrador</h3>

            <input
                id="nombreAdministrador"
                type="text"
                placeholder="Nombre completo">

            <input
                id="correoAdministrador"
                type="email"
                placeholder="Correo electrónico">

            <input
                id="passwordAdministrador"
                type="password"
                placeholder="Contraseña">

        `,

        botones: `

            <button
                class="btn"
                onclick="cerrarModal()">

                Cancelar

            </button>

            <button
                class="btn btn-primary"
                onclick="crearLigaModal()">

                Crear Liga

            </button>

        `

    });

}

async function crearLigaModal() {

    const nombreLiga = document
        .getElementById("nombreNuevaLiga")
        .value
        .trim();

    const nombreAdministrador = document
        .getElementById("nombreAdministrador")
        .value
        .trim();

    const correoAdministrador = document
        .getElementById("correoAdministrador")
        .value
        .trim();

    const passwordAdministrador = document
        .getElementById("passwordAdministrador")
        .value;

    if (
        !nombreLiga ||
        !nombreAdministrador ||
        !correoAdministrador ||
        !passwordAdministrador
    ) {

        alert("Completa todos los campos.");

        return;

    }

    const res = await fetch("/fundador/ligas", {

        method: "POST",

        headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${localStorage.getItem("token")}`

        },

        body: JSON.stringify({

            liga: {

                nombre: nombreLiga

            },

            administrador: {

                nombre: nombreAdministrador,

                email: correoAdministrador,

                password: passwordAdministrador

            }

        })

    });

    const data = await res.json();

    if (!res.ok) {

        alert(data.mensaje);

        return;

    }

    cerrarModal();

    renderLigas();

}