function Table({

    headers,

    rows,

    className=""

}){

    return `

        <table class="${className}">

            <thead>

                <tr>

                    ${headers.map(h=>`<th>${h}</th>`).join("")}

                </tr>

            </thead>

            <tbody>

                ${rows.join("")}

            </tbody>

        </table>

    `;

}