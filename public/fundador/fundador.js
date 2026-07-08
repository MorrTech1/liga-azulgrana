// ==========================================
// MORRTECH
// Founder Panel
// ==========================================

// Vista actual
let vistaActual = "dashboard";

// ================================
// INICIO
// ================================

window.onload = () => {

    mostrarDashboard();

};

// ================================
// TÍTULOS
// ================================

function actualizarHeader(titulo, subtitulo) {

    document.getElementById("tituloVista").textContent = titulo;

    document.getElementById("subtituloVista").textContent = subtitulo;

}

function limpiarContenido() {
    document.getElementById("contenido").innerHTML = "";
}

// ================================
// MENU
// ================================

function activarMenu(indice) {

    document
        .querySelectorAll(".menu-item")
        .forEach(b => b.classList.remove("active"));

    document
        .querySelectorAll(".menu-item")[indice]
        .classList.add("active");

}

// ================================
// DASHBOARD
// ================================

function mostrarDashboard() {

    vistaActual = "dashboard";

    activarMenu(0);

    actualizarHeader(
        "Dashboard",
        "Resumen general del sistema."
    );

    limpiarContenido();

    renderDashboard();

}

// ================================
// LIGAS
// ================================

function mostrarClientes() {

    vistaActual = "clientes";

    activarMenu(1);

    actualizarHeader(
        "Clientes",
        "Administra las ligas y sus administradores."
    );
    
    limpiarContenido();
    renderClientes();

}

// ================================
// ADMINISTRADORES
// ================================

function mostrarAdministradores() {

    vistaActual = "administradores";

    activarMenu(2);

    actualizarHeader(
        "Administradores",
        "Gestiona los administradores."
    );

    limpiarContenido();

    renderAdministradores();

}

function cargarVista(html) {

    const contenido = document.getElementById("contenido");

    contenido.innerHTML = html;

}

// ================================
// CERRAR SESION
// ================================

function cerrarSesion() {

    if (!confirm("¿Cerrar sesión?")) return;

    localStorage.removeItem("token");

    location.href = "/admin.html";

}