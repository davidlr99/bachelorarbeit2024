const { JsonParsers } = require("../jsonParsers");

class EmbeddingBuilder {
    constructor(data) {
        this.data = data
        this.fields = {}
        this.plainResults = {}
        this.embeddings = {}

        var jsonParser = new JsonParsers()
        this.jsonParser = jsonParser

        this.fieldsLocked = false
    }
    autoAddFields(fields) {
        for (var name in fields) {
            var key = fields[name]
            for (var i in this.data) {
                var entry = this.data[i].data
                var entryFields = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(key), entry)
                if (entryFields.length != undefined) {
                    entryFields.sort()
                }
                // this.plainResults[name].push({ id: this.data[i].id, fields: entryFields })
                this.addToField(name, this.data[i].id, JSON.stringify(entryFields))
            }

        }
    }

    addToField(fieldName, recordID, content) {
        if (this.fields[fieldName] == undefined) {
            this.fields[fieldName] = []
        }
        if (this.fields[fieldName].includes(content) == false && !this.fieldsLocked) {
            this.fields[fieldName].push(content)
        } else if (this.fieldsLocked && this.fields[fieldName].includes(content) == false) {
            // console.log("would be new but field locked: "+ content)
        }


        if (this.plainResults[fieldName] == undefined) {
            this.plainResults[fieldName] = []
        }



        var found = -1
        for (var i in this.plainResults[fieldName]) {
            if (this.plainResults[fieldName][i].id == recordID) {
                found = i
            }
        }

        if (found == -1) {
            this.plainResults[fieldName].push({ id: recordID, fields: [content] })
        } else {
            var oldRecord = this.plainResults[fieldName][found]
            oldRecord.fields.push(content)
            this.plainResults[fieldName][found] = oldRecord
        }


    }

    addEmbedding(fieldNames) {
        for (var m in fieldNames) {
            var name = fieldNames[m]

            //Fields sortieren damit Vektor einheitlich
            this.fields[name] = this.fields[name].sort()

            var existingFields = this.fields[name]
            if (existingFields == undefined) {
                console.log("Fields for " + name + " missing. Did you add the fields?")
                return
            }

            //hier evtl restrukturieren, kann besser vereinheitlicht werden

            // console.dir(this.fields[name],{depth: null, colors: true, maxArrayLength: null})
            // console.dir(this.plainResults[name],{depth: null, colors: true, maxArrayLength: null})

            var embedding = {}
            for (var i in existingFields) {
                var field = existingFields[i]
                for (var n in this.plainResults[name]) {
                    var resultFields = this.plainResults[name][n].fields

                    if (embedding[this.plainResults[name][n].id] == undefined) {
                        embedding[this.plainResults[name][n].id] = Array(existingFields.length).fill(0)
                    }

                    //Evtl hier anstatt binär d.h. 1 oder 0 die Anzahl der Vorkommen

                    if (resultFields.includes(field)) {
                        embedding[this.plainResults[name][n].id][i] = 1

                    } else {
                        embedding[this.plainResults[name][n].id][i] = 0
                    }

                }
            }
            this.embeddings[name] = embedding
        }
    }

    lockFields() {
        //Wenn fields gelocked werden dann können keine neuen Dimensionen mehr daszu kommen.
        this.fieldsLocked = true
    }

    unlockFields() {
        this.fieldsLocked = false
    }

    load() {
        console.log("load() - nicht Überschrieben")
    }
}

module.exports = {
    EmbeddingBuilder
};