async function renderDashboard(){

    const res = await fetch('/fundador/dashboard',{

        headers:{
            Authorization:`Bearer ${localStorage.getItem('token')}`
        }

    });

    const data = await res.json();

    cargarVista(`

        <div class="cards">

            ${Card({

                titulo:"Ligas",

                valor:data.ligas,

                icono:"fa-solid fa-trophy"

            })}

            ${Card({

                titulo:"Administradores",

                valor:data.administradores,

                icono:"fa-solid fa-user-shield",

                color:"#2563eb"

            })}

            ${Card({

                titulo:"Activas",

                valor:data.activas,

                icono:"fa-solid fa-circle-check",

                color:"#16a34a"

            })}

            ${Card({

                titulo:"Suspendidas",

                valor:data.suspendidas,

                icono:"fa-solid fa-circle-xmark",

                color:"#dc2626"

            })}

        </div>

        <div class="panel">

            <h2>

                Últimas ligas

            </h2>

            <br>

            <table>

                <thead>

                    <tr>

                        <th>Nombre</th>

                        <th>Administrador</th>

                        <th>Estado</th>

                    </tr>

                </thead>

                <tbody>

                    ${data.ultimasLigas.map(l=>`

                        <tr>

                            <td>${l.nombre}</td>

                            <td>${l.administrador || "-"}</td>

                            <td>

                                ${
                                    l.activa
                                    ? '<span class="badge badge-success">Activa</span>'
                                    : '<span class="badge badge-danger">Suspendida</span>'
                                }

                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

    `);

}