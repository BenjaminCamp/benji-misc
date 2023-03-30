

const axios = require("axios");
const Compta = require("./Compta");
const Collections = require("./Collections");
const Formatting = require("./Formatting");


class InqomMapping {

    static DEFAULT_PRIORITY  = 1000;

    static DESCRIPTIONS = {
        NEW_ACCOUNT : "New account",
        ACCOUNT_REMOVAL : "Account removal",
        ATTRIBUTE_CHANGE : "Attribute change"
    }
    /**
     * Compare les deux PCGs Inqom TRIES PAR COMPTE COMPTABLE, et retourne leurs différences
     * si elles existent
     * @param oldest
     * @param newest
     * @return {Object}
     */
    static comparePCGs(oldest, newest) {

        let oldObj, oldEntries, newEntries, newObj
        let oldKeyVal, newKeyVal
        let modifiedAccountNumber
        let diffs = new Map(), diffForCurrentObject = []
        let diffDescription
        let oldOffset = 0, newOffset = 0

        let i;
        for (i = 0; i + oldOffset < oldest.length && i + newOffset < newest.length ; i++) {
            diffForCurrentObject = []
            oldObj = oldest[i + oldOffset]
            newObj = newest[i + newOffset]

            // Compte différent entre old et new
            if (oldObj.Account !== newObj.Account) {

                if (Compta.compareCompteComptable(oldObj.Account,newObj.Account === 1)) {
                    // Cas ajout d'un nouveau compte
                    diffDescription = this.DESCRIPTIONS.NEW_ACCOUNT
                    oldOffset--
                    // newOffset++
                } else {
                    // Cas suppression d'un compte
                    diffDescription = this.DESCRIPTIONS.ACCOUNT_REMOVAL
                    newOffset--
                    // oldOffset++
                }

                diffForCurrentObject.push(
                    {
                        description: diffDescription,
                        old: diffDescription !== this.DESCRIPTIONS.NEW_ACCOUNT ? oldObj : undefined,
                        new: diffDescription !== this.DESCRIPTIONS.ACCOUNT_REMOVAL ? newObj : undefined,
                    }
                )

                modifiedAccountNumber = diffDescription === this.DESCRIPTIONS.NEW_ACCOUNT ?
                    newObj.Account : oldObj.Account
            } else { // Compte identique des deux côtés : recherche des différences au sein de l'entrée

                oldEntries = Object.entries(oldObj)
                newEntries = Object.entries(newObj)

                for (let j = 0; j < oldEntries.length && j < newEntries.length; j++) {
                    oldKeyVal = oldEntries[j]
                    newKeyVal = newEntries[j]
                    if (oldKeyVal[0] !== newKeyVal[0] || oldKeyVal[1] !== newKeyVal[1]) {

                        diffForCurrentObject.push(
                            {
                                description: this.DESCRIPTIONS.ATTRIBUTE_CHANGE,
                                old: oldObj,
                                new: newObj,
                            }
                        )
                    }
                }
                modifiedAccountNumber = oldObj.Account
            }

            if (diffForCurrentObject.length > 0) {
                // diffs[oldObj["Account"]] = diffForCurrentObject
                diffs.set(modifiedAccountNumber, diffForCurrentObject)
            }
        }

        // Analyse des champs non parsés
        let pcgToFinish = [], startIndex, isOldPCG = false
        if (i + oldOffset < oldest.length) {
            pcgToFinish = oldest
            startIndex = i + oldOffset
            isOldPCG = true
        } else if (i + newOffset < newest.length) {
            pcgToFinish = newest
            startIndex = i + newOffset
        }

        for (let n = startIndex; n < pcgToFinish.length; n++) {
            diffs.set(pcgToFinish[n].Account, [{
                description: isOldPCG ? this.DESCRIPTIONS.ACCOUNT_REMOVAL : this.DESCRIPTIONS.NEW_ACCOUNT,
                old : isOldPCG ? pcgToFinish[n] : null,
                new : isOldPCG ? null : pcgToFinish[n],
            }])
        }
        // TODO V2 -> persistance des changes, datés

        let jsonDiffs = Collections.mapToJSON(diffs)
        return {
            changed: diffs.size !== 0,
            changes: jsonDiffs,
            changesAsHTML: Formatting.diffsJSONToHTMLTable(jsonDiffs)
        }
    }


    static async detectAccountFusions() {
        let mapping = await this.getInqomPCG()
        mapping = this.sortInqomMappingByAscAccount(mapping)
        let fusedAccounts = []
        let needArbitration = []
        let problematicAccountList = []
        for (let e of mapping) {
            // if (e.MappingAccount) {
            //     // Si compte destination n'est pas le compte en question
            //     if (!e.Account != e.MappingAccount) {
            //         fusedAccounts.push(e)
            //     }
            // } else { // si aucun compte n'est mappé
            //     needArbitration.push(e)
            // }
            if (!(e.MappingAccount && e.Account === e.MappingAccount)) {
                problematicAccountList.push({
                    Account: e.Account,
                    MappedByInqom: e.MappingAccount,
                    MappedBy471: e.MappingAccount,
                    Regex: '^' + e.Account + '$',
                    OutputUnicity: 'INCREMENT',
                    Priority: this.DEFAULT_PRIORITY

                })

                // Création du mapping pour le compte mappé s'il est différent du compte origine
                if (e.MappingAccount) {

                    problematicAccountList.push({
                        Account: e.MappingAccount,
                        MappedByInqom: e.MappingAccount,
                        MappedBy471: e.MappingAccount,
                        Regex: '^' + e.MappingAccount + '$',
                        OutputUnicity: 'INCREMENT',
                        Priority: this.DEFAULT_PRIORITY
                    })
                }

                // if (e.MappingAccount) {
                //     problematicAccountList.push(e.MappingAccount)
                // }
            }
        }

        // return {
        //     fusedAccounts : fusedAccounts,
        //     needArbitration: needArbitration
        // }
        return problematicAccountList
    }
    /**
     * Retoune le mapping Inqom à jour format CSV, trié par num compte croissant
     * @returns {Promise<*>}
     */
    static async getInqomMappingAsCSV() {
        let mapping = await this.getInqomPCG()
        let sortedMapping = this.sortInqomMappingByAscAccount(mapping)
        return this.inqomMappingToCSV(sortedMapping)
    }

    /**
     * Retourne la liste des mappings Inqom triée par numéro de compte croissant
     * @param mapping
     * @returns {*}
     */
    static sortInqomMappingByAscAccount(mapping) {
        return mapping.sort(this.compareInqomMappingEntry)
    }

    /**
     * Comparator de tri des mappings Inqom par numéro de compte
     * @param a
     * @param b
     * @returns {number}
     */
    static compareInqomMappingEntry(a, b) {
        return Compta.compareCompteComptable(a.Account, b.Account)
    }


    /**
     * Récupère la liste à jour du mapping de compte Inqom
     * @returns {Object}
     *      {
     *         "Managed": {boolean},
     *         "Impactable": {boolean},
     *         "Dividable": {boolean},
     *         "Divided": {string},
     *         "IsAux": {boolean},
     *         "IsSub": {boolean},
     *         "EnterpriseId": {int},
     *         "Account": {int},
     *         "AccountClass": {int},
     *         "AccountLabel":{string},
     *         "AccountName": {int},
     *         "AccountDescription": {string},
     *         "AccountId": {int}
     *     },
     */
    static async getInqomPCG() {

        let data = '';

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://api.inqom.com/api/app/enterprises/20440/BookAccount/All',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2F1dGguZnJlZGRlbGFjb21wdGEuY29tL2lkZW50aXR5IiwiYXVkIjoiaHR0cHM6Ly9hdXRoLmZyZWRkZWxhY29tcHRhLmNvbS9pZGVudGl0eS9yZXNvdXJjZXMiLCJleHAiOjE3MDgwNzU2MTgsIm5iZiI6MTY3Njk3MTYxOCwiY2xpZW50X2lkIjoiZ3JlZW5sb28iLCJzY29wZSI6WyJhcGlkYXRhIiwib3BlbmlkIl0sInN1YiI6IjY0ODAiLCJhdXRoX3RpbWUiOjE2NzY5NzE2MTgsImlkcCI6Imlkc3J2IiwiZW1haWwiOiJiZW5qYW1pbi5jQGlucW9tLXNlcnZpY2VzLmNvbSIsIm5hbWUiOiJiZW5qYW1pbi5jQGlucW9tLXNlcnZpY2VzLmNvbSIsInVzZXJpZCI6IjY0ODAiLCJ1c2VybmFtZSI6ImJlbmphbWluLmNAaW5xb20tc2VydmljZXMuY29tIiwiZW50ZXJwcmlzZWlkIjoiMjY5MSIsImVudGVycHJpc2Vyb2xlcyI6IkRBRl9HUk9VUEUiLCJyaWdodCI6WyJ1c2VyaW5mbyxyZWZlcmVudGlhbCx1c2VkZWNsYXJhdGlvbmVkaSx1c2VyaW5mb3dyaXRlLGFjY291bnRhbnQsYWNjb3VudGFudHdyaXRlLGNsaWVudCxjbGllbnR3cml0ZSxib29ra2VlcGluZyxib29ra2VlcGluZ3dyaXRlLGFzc2lnbm1lbnQsYXNzaWdubWVudHdyaXRlLGZpbGVzLGZpbGVzd3JpdGUsY29sbGFib3JhdG9ycyxjb2xsYWJvcmF0b3Jzd3JpdGUsY29sbGFib3JhdG9yc2VudGVycHJpc2UsY29sbGFib3JhdG9yc2VudGVycHJpc2V3cml0ZSxpbnZpdGVjb2xsYWJvcmF0b3IsaW52aXRlY29sbGFib3JhdG9yd3JpdGUsZW50ZXJwcmlzZWVtYWlscHJvdmlkZXJzLGVudGVycHJpc2VlbWFpbHByb3ZpZGVyc3dyaXRlLGJhbmtpbixiYW5raW53cml0ZSx0aWNrZXQsdGlja2V0d3JpdGUsY3JlYXRlZW50ZXJwcmlzZSxjcmVhdGVlbnRlcnByaXNld3JpdGUsdXNlZGVjbGFyYXRpb25lZGl3cml0ZSxlbnRlcnByaXNlYWRtaW4sZW50ZXJwcmlzZWFkbWluYWxsLGludml0ZWNsaWVudCxpbnZpdGVjbGllbnR3cml0ZSIsIiJdLCJhbXIiOlsicGFzc3dvcmQiXX0.Xm4El6lVSATcr3eIqijJxqQIIXycfvXcoBHpJ7BUPHTaugMUAQU43ZFqj0cGhoOhrLAwBXYBlGvXInmSeQITLSQBDIwg4a2lKJEpep9AASxzp25vcE9_t1QQMcFU65OKSMLrIeHNrLTEfm_H9BPymSLRQgbeLD8reUa0DvBMTR5tPqz6I5OLcfCTJ88EPS-ybA38fTBXGbvvEpOYoyVsWRDOuUNnT1lH3_4Uo4kE_E2PrOr3ijyq9U4zwIgrC83GPqWM5hBpkfAbMA8mdPYA2AbvVKTQcMMAUTg9P191yEHKjWqRwDyGcALZOLwIzcHO6ABFXs_CWYuh2cBJBEJExw'
            },
            data : data
        };

        return axios(config)
            .then(function (response) {
                // console.log(JSON.stringify(response.data));
                return response?.data ? response.data : null
            })
            .catch(function (error) {
                console.error(error);
                throw error
            });

    }

    static inqomMappingToCSV(mapping) {
        let csvContent = ""
        let csvSeparator = "\t"
        let lineSeparator = "\n"
        let header = ["Compte", "Description", "Impactable ?", "Subdivisable ?", "Compte mappé vers"]
        let fieldsToDisplay = ["Account", "AccountDescription", "Impactable", "Dividable", "MappingAccount"]

        for (let cell of header) {
            csvContent += cell + csvSeparator
        }
        csvContent += lineSeparator

        for (let e of mapping) {
            for (let field of fieldsToDisplay) {
                csvContent += e[field] + csvSeparator
            }
            csvContent += lineSeparator
        }

        return csvContent
    }
}

module.exports = InqomMapping