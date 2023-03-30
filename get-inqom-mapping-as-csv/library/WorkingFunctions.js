const fs = require('fs')
const axios = require('axios');
const InqomMapping = require("./InqomMapping");
const CSV = require('./CSV')


/////////
class WorkingFunctions {
    static OLD_PCG_FILE_URL = "./PCGs/oldPCG.json"

    generateInqomMappingCSV() {
        InqomMapping.getInqomMappingAsCSV()
            .then((res) => {
                console.log(res)
                fs.writeFileSync("./MappingInqom.csv", res)
                console.log('Fichier écrit !')
            })
    }

    async generateGuessedMapping() {

        // Récupération du mapping


        // Détection des fusions potentielles
        let fusedAccounts = await InqomMapping.detectAccountFusions()

        // Génération CSV
        let headers = ["Account", "Compte mappé par Inqom","Notre mapping", "Regex", "output_unicity", "priority"]
        let fields = ["Account", "MappedByInqom", "MappedBy471", "Regex", "OutputUnicity","Priority"]

        let csvContent = CSV.createCSV(headers, fields, fusedAccounts,'A DEFINIR')

        fs.writeFileSync("./AccountToMap.csv",csvContent)
    }

    static async checkForInqomPCGChanges() {
        // Récupérer le plan comptable du jour
        // let todaysPCG = JSON.parse(fs.readFileSync('./PCGs/PCG1.json').toString('utf8'))
        let todaysPCG = await InqomMapping.getInqomPCG()
        let oldPCG = JSON.parse(fs.readFileSync(WorkingFunctions.OLD_PCG_FILE_URL).toString('utf8'))

        // Comparaison avec le plan comptable d'hier
        let pcgChanged = InqomMapping.comparePCGs(
            InqomMapping.sortInqomMappingByAscAccount(oldPCG),
            InqomMapping.sortInqomMappingByAscAccount(todaysPCG));

        // if (pcgHasChanged?.changed === true) {
        //     // Retourner status "changé" plus la différence entre les deux pcgs
        //
        //
        //     // TODO v2 : ajouter une entrée dans un BDD pour garder un historique des changements
        //
        // }

        if (pcgChanged.changed) {
            // console.log('Le PCG Inqom a changé ! 🔥')
            // console.log('Liste des changements :')
            // for (let change of pcgChanged.changes) {
            //     console.log('- Compte ', change.Account, ':')
            //     for (let field of Object.entries(change.Value[0])) {
            //         console.log('\t-',field[0], ' : ', field[1])
            //         break; // Virer pour avoir full détail, mais plus lisible avec ce break :)
            //     }
            // }
            //
            // // Sauvegarde du PCG du jour à la place de l'ancien
            // // fs.writeFileSync(WorkingFunctions.OLD_PCG_FILE_URL, JSON.stringify(todaysPCG,null,2))
            //
            // console.log('PCG écrit.')
        } else {
            console.log('Aucun changement détecté sur Inqom.')
        }
        return pcgChanged
    }
}

module.exports = WorkingFunctions
