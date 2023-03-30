


class Collections {

    /**
     * Convertit la map argumente en JSON
     * @param map
     */
    static mapToJSON(map) {

        let iterator = map.entries()
        let curr
        let res = []
        while (!(curr = iterator.next()).done) {
            res.push(
                {
                    Account: curr.value[0],
                    Value : curr.value[1]
                }
            )
        }

        return res
    }
}

module.exports = Collections