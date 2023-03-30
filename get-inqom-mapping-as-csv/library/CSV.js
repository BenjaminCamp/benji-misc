

class CSV {

    static CSV_SEPARATOR = '\t'
    static CSV_LINE_SEPARATOR = '\n'

    static createCSV(headers, fields, contentToWrite, valueIfNullOrUndefined) {
        let csvContent = ""
        if (headers) {
            for (let cell of headers) {
                csvContent += cell + this.CSV_SEPARATOR
            }
            csvContent += this.CSV_LINE_SEPARATOR
        }


        for (let e of contentToWrite) {
            for (let field of fields) {

                csvContent += ((e[field]) ? e[field] : valueIfNullOrUndefined)
                    + this.CSV_SEPARATOR
            }
            csvContent += this.CSV_LINE_SEPARATOR
        }

        return csvContent
    }
}

module.exports = CSV