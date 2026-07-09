let categoriaEditando = null;


async function renderCategorias() {

    await cargarCategoriasCache();

    const filas = categoriasCache.map(c => `

        <tr data-categoria="${c.nombre.toLowerCase()}">

            <td>${c.nombre}</td>

            <td>

                 

<button
    class="btn-icon btn-eliminar"
    onclick="confirmarEliminarCategoria(${c.id})">

    🗑️

</button>

            </td>

        </tr>

    `);

    document.getElementById("tablaCategorias").innerHTML = Table({

        headers: [

            "Nombre",

            "Acciones"

        ],

        rows: filas,

        className: "tabla-admin"

    });

}


function mostrarFormularioCategoria(categoria = null){

    categoriaEditando = categoria;

    abrirModal({

        titulo: categoria
            ? "Editar categoría"
            : "Nueva categoría",

        contenido:`

            <input
                id="modalNombreCategoria"
                class="input-busqueda"
                placeholder="Nombre de la categoría"
                value="${categoria ? categoria.nombre : ""}">

        `,

        botones:`

            <button
                class="btn-cancelar"
                onclick="cerrarModal()">

                Cancelar

            </button>

            <button
                class="btn-crear"
                onclick="guardarCategoria()">

                Guardar

            </button>

        `

    });

}

function guardarCategoria(){

    if(categoriaEditando){

        actualizarCategoria();

    }else{

        crearCategoria();

    }

}



async function cargarCategoriasCache() {
  const res = await fetch('/categorias', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
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
  fetch('/categorias',{
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
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
  const nombre = document.getElementById('modalNombreCategoria').value;

  fetch('/categorias', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ nombre })
  })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);
      
      cargarCategorias();
    })
    .catch(err => alert(err.message));
  
    cerrarModal();

    mostrarToast("Categoría creada.","success");

cargarCategorias();

renderCategorias();

}

function confirmarEliminarCategoria(id){

    abrirModal({

        titulo:"Eliminar categoría",

        contenido:`

            <p style="color:#888; margin-top:10px;">

                ¿Estás seguro de eliminar esta categoría?

            </p>

            <p style="color:#888;">

                Esta acción no se puede deshacer.

            </p>

        `,

        botones:`

            <button
                class="btn-cancelar"
                onclick="cerrarModal()">

                Cancelar

            </button>

            <button
                class="btn-eliminar"
                onclick="eliminarCategoria(${id})">

                Eliminar

            </button>

        `

    });

}



function filtrarCategorias(){

    const texto = document
        .getElementById("buscarCategoria")
        .value
        .toLowerCase();

    document
        .querySelectorAll("#tablaCategorias tbody tr")
        .forEach(fila=>{

            const nombre = fila.dataset.categoria;

            fila.style.display =
                nombre.includes(texto)
                ? ""
                : "none";

        });

}



async function eliminarCategoria(id){

    const res = await fetch(`/categorias/${id}`,{

        method:"DELETE",

        headers:{

            Authorization:`Bearer ${localStorage.getItem("token")}`

        }

    });

    const data = await res.json();

    if(!res.ok){

        mostrarToast(data.mensaje,"error");

        return;

    }

    mostrarToast("Categoría eliminada.","success");

    cerrarModal();

    await cargarCategorias();

    renderCategorias();

}
