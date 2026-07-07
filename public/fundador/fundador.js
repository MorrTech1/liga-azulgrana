const token = localStorage.getItem("token");





function mostrarDashboard(){

    document.getElementById("contenido").innerHTML=`
        <h2>Dashboard</h2>
    `;

}

function mostrarAdministradores(){

    document.getElementById("contenido").innerHTML=`
        <h2>Administradores</h2>
    `;

}

function cerrarSesion(){

    localStorage.removeItem("token");

    window.location.href="/";

}

async function mostrarLigas(){

    console.log(localStorage.getItem("token"));

    const res = await fetch('/fundador/ligas',{

        headers:{
            Authorization:`Bearer ${localStorage.getItem('token')}`
        }

    });

    const ligas = await res.json();

    let html=`

        <h2>Ligas</h2>

        <table border="1" cellpadding="8">

        <tr>

            <th>ID</th>

            <th>Nombre</th>

            <th>Estado</th>

        </tr>

    `;

    ligas.forEach(l=>{

        html+=`

            <tr>

                <td>${l.id}</td>

                <td>${l.nombre}</td>

                <td>${l.activa ? 'Activa':'Suspendida'}</td>

            </tr>

        `;

    });

    html+=`</table>`;

    document.getElementById("contenido").innerHTML=html;

}