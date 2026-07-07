function Table({ headers, rows }) {

    return `

        <table>

            <thead>

                <tr>

                    ${headers.map(h => `<th>${h}</th>`).join("")}

                </tr>

            </thead>

            <tbody>

                ${rows.join("")}

            </tbody>

        </table>

    `;

}