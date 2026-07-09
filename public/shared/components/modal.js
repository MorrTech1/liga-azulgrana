// ==========================================
// MORRTECH MODAL COMPONENT
// ==========================================

function abrirModal({

    titulo,

    contenido,

    botones = ""

}){

    cerrarModal();

    const modal = document.createElement("div");

    modal.className = "modal";

    modal.id = "modalMorrTech";

    modal.innerHTML = `

        <div class="modal-content">

            <div class="modal-header">

                <h2>${titulo}</h2>

                <button
                    class="modal-close"
                    onclick="cerrarModal()">

                    ✕

                </button>

            </div>

            <div class="modal-body">

                ${contenido}

            </div>

            <div class="modal-footer">

                ${botones}

            </div>

        </div>

    `;

    document.body.appendChild(modal);

}

function cerrarModal(){

    const modal = document.getElementById("modalMorrTech");

    if(modal){

        modal.remove();

    }

}