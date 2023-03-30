

class Formatting {


    static diffsJSONToHTMLTable(jsonChanges) {

        if (!(jsonChanges && jsonChanges.length > 0)) {
            return ""
        }

        let html

        let tableGlobalStyle = "border : 1px solid black"
        // Table root
        html = "" +
            "<table style='" + tableGlobalStyle + "'>" +
            "<thead style='" + tableGlobalStyle + "'>" +
            "<th>Compte</th>" +
            "<th>Type de changement</th>" +
            "<th>Ancienne valeur</th>" +
            "<th>Nouvelle valeur</th>" +
            "</thead>" +
            "<tbody style='" + tableGlobalStyle + "'>"
        for (let account of jsonChanges) {
            html += "<tr>"
            html += "<td>" + account.Account + "</td>"
            for (let change of account.Value) {
                html += "<td>" + change.description + "</td>"
                html += "<td>" + this.jsonToHTML(change.old) + "</td>"
                html += "<td>" + this.jsonToHTML(change.new) + "</td>"
            }

            html += "</tr>"
        }

        html +=
            "</tbody></table>"
        return html
    }

    static jsonToHTML(json) {

        // return JSON.stringify(json)
        let html = "<table>"
        html    += "<thead>"
        html    += "<th>Attribut</th>"
        html    += "<th>Valeur</th>"
        html    += "</thead>"
        html    += "<tbody>"
        for (let [key, value] of Object.entries(json)) {

            html += '<tr><td>' + key + '</td>'
            html += '<td>' + value + '</td></tr>'
        }
        html    += "</tbody>"

        console.log('HTML : ', html)
        return html
    }
}

module.exports = Formatting