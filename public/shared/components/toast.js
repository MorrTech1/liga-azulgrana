// =====================================
// TOAST COMPONENT
// =====================================

function mostrarToast(mensaje, tipo = "success") {

    const viejo = document.getElementById("toast");

    if (viejo) {

        viejo.remove();

    }

    const toast = document.createElement("div");

    toast.id = "toast";

    toast.className = `toast toast-${tipo}`;

    toast.textContent = mensaje;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.classList.add("mostrar");

    }, 10);

    setTimeout(() => {

        toast.classList.remove("mostrar");

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);

}