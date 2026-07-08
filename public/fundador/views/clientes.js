// ==========================================
// LIGAS
// ==========================================

async function renderClientes(){

    const res = await fetch('/fundador/ligas',{

        headers:{
            Authorization:`Bearer ${localStorage.getItem('token')}`
        }

    });

    const ligas = await res.json();

    const filas = ligas.map(l=>`

        <tr data-liga="${l.nombre.toLowerCase()}">

            <td>${l.nombre}</td>

<td>${l.administrador || "-"}</td>

<td>${l.email || "-"}</td>

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

        title="Editar"

        onclick="editarLiga(

            ${l.id},

            '${l.nombre.replace(/'/g,"\\'")}'

        )">

        <i class="fa-solid fa-pen"></i>

    </button>

    <button

        class="btn ${l.activa ? "btn-danger" : "btn-primary"}"

        title="${l.activa ? "Suspender" : "Reactivar"}"

        onclick="confirmarEstadoLiga(

            ${l.id},

            ${l.activa}

        )">

        <i class="fa-solid ${l.activa ? "fa-pause" : "fa-play"}"></i>

    </button>

</td>

        </tr>

    `);

    cargarVista(`

        <div class="panel"
    style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:20px;
        margin-bottom:25px;
">

    <button
        class="btn btn-primary"
        onclick="mostrarFormularioLiga()">

        + Nueva Liga

    </button>

    <input

        id="buscarLiga"

        placeholder="Buscar liga..."

        style="
            max-width:300px;
            margin:0;
        "

        oninput="filtrarLigas()">

</div>

            ${Table({

                headers:[

                    

                    "Liga",
                    "Administrador",

                    "Correo",

                    "Estado",

                    "Acciones"

                ],

                rows:filas

            })}

        </div>

    `);

}

function confirmarEstadoLiga(id, activa){

    abrirModal({

        titulo: activa
            ? "Suspender Liga"
            : "Reactivar Liga",

        contenido:`

            <p>

                ${
                    activa
                    ? "¿Seguro que deseas suspender esta liga?<br><br>Los administradores ya no podrán iniciar sesión."
                    : "¿Deseas reactivar esta liga?"
                }

            </p>

        `,

        botones:`

            <button
                class="btn"
                onclick="cerrarModal()">

                Cancelar

            </button>

            <button
                class="btn ${activa ? "btn-danger" : "btn-primary"}"
                onclick="cambiarEstadoLiga(${id})">

                ${activa ? "Suspender" : "Reactivar"}

            </button>

        `

    });

}

async function cambiarEstadoLiga(id){

    
    await fetch(`/fundador/ligas/${id}/estado`,{

        method:"PUT",

        headers:{
            Authorization:`Bearer ${localStorage.getItem('token')}`
        }

    });

    cerrarModal();

    mostrarToast("Estado de la liga actualizado.");

    mostrarligas();

}

function editarLiga(id,nombre){

    abrirModal({

        titulo:"Editar Liga",

        contenido:`

            <input

                id="editarNombreLiga"

                value="${nombre}"

                placeholder="Nombre">

        `,

        botones:`

            <button

                class="btn"

                onclick="cerrarModal()">

                Cancelar

            </button>

            <button

                class="btn btn-primary"

                onclick="guardarEdicionLiga(${id})">

                Guardar

            </button>

        `

    });

}

async function guardarEdicionLiga(id){

    const nombre=document

        .getElementById("editarNombreLiga")

        .value

        .trim();

    if(!nombre){

        mostrarToast("El nombre no puede estar vacío.","error");

        return;

    }

    const res=await fetch(

        `/fundador/ligas/${id}`,

        {

            method:"PUT",

            headers:{

                "Content-Type":"application/json",

                Authorization:`Bearer ${localStorage.getItem("token")}`

            },

            body:JSON.stringify({

                nombre

            })

        }

    );

    const data=await res.json();

    if(!res.ok){

        mostrarToast(data.mensaje,"error");

        return;

    }

    cerrarModal();

    mostrarToast("Liga actualizada correctamente.");
     
    mostrarligas();

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

        mostrarToast(data.mensaje, "error");

        return;

    }

    cerrarModal();

    mostrarToast("Liga creada correctamente.");

    mostrarligas();

}

function filtrarLigas(){

    const texto = document
        .getElementById("buscarLiga")
        .value
        .toLowerCase();

    document
        .querySelectorAll("tbody tr")
        .forEach(fila=>{

            const nombre = fila.dataset.liga;

            fila.style.display =
                nombre.includes(texto)
                ? ""
                : "none";

        });

}