
class Compta {

    /**
     * Comparaison des chiffres de a et b un à un
     * Le premier à avoir un digit plus grand que l'autre ou à voir son
     * chiffre adversaire null est le plus grand
     * @param a
     * @param b
     * @returns {number} 1 si a > b, 0 si a === b, -1 si a < b
     */
    static compareCompteComptable(a,b) {
        a = a.toString()
        b = b.toString()
        let longestLength = a.length > b.length ? a.length : b.length
        for (let i = 0; i < longestLength; i++) {
            if (!b[i] || a[i] > b[i]) {
                return 1
            } else if (!a[i] || a[i] < b[i]) {
                return -1
            }
        }
        return 0;
    }
}

module.exports = Compta