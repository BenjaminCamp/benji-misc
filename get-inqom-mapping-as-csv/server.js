const express = require('express')
const WorkingFunctions = require("./library/WorkingFunctions");
const app = express()
const port = 3000

app.get('/pcg-checker', async (req, res) => {
    let pcgChanged = await WorkingFunctions.checkForInqomPCGChanges()

    let msg = ""
    if (!pcgChanged.changed) {
        msg = "No changes in Inqom PCG since last execution."
    } else {
        msg = "Inqom PCG has changed !"
    }

    let changes = pcgChanged.changes
    let changes = JSON.stringify(pcgChanged.changes,null,2)
    res.status(200).json({message: msg, changed: pcgChanged.changed,
        changes: pcgChanged, changesAsHTML: pcgChanged.changesAsHTML})
})

app.get('/callback', async (req, res) => {
    console.log('C bon yarien')
    res.status(200).send()
})
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
