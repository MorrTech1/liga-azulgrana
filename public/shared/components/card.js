// ==========================================
// CARD COMPONENT
// MorrTech Design System
// ==========================================

function Card({

    titulo,

    valor,

    icono = "",

    color = "var(--primary)"

}) {

    return `

        <div class="card">

            <div class="card-header">

                <div>

                    <h3>${titulo}</h3>

                    <div class="numero">

                        ${valor}

                    </div>

                </div>

                <div
                    class="card-icon"
                    style="background:${color}">

                    <i class="${icono}"></i>

                </div>

            </div>

        </div>

    `;

}