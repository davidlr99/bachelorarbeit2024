const { JsonParsers } = require("../jsonParsers");

class Index {
    constructor(data) {
        this.data = data //data needs to have an id
        this.index = {}

        var jsonParser = new JsonParsers()
        this.jsonParser = jsonParser

    }
    buildIndex(key) {
        //Aus key index bauen 
        var parsedKey = this.jsonParser.buildKey(key)
        for (var i in this.data) {
            var entry = this.data[i].data

            var terms = this.jsonParser.traverseWithKeyRec(parsedKey, entry)

            for (var n in terms) {
                var term = terms[n]

                this.addToIndex(this.data[i].id, term)
                // if ((typeof this.index[term]) == "undefined") {
                //     this.index[term] = [this.data[i].id]
                // } else if (!this.index[term].includes(this.data[i].id)) {
                //     this.index[term].push(this.data[i].id)
                // }
            }

        }
    }
    addToIndex(id, term) {
        if ((typeof this.index[term]) == "undefined") {
            this.index[term] = [id]
        } else if (!this.index[term].includes(id)) {
            this.index[term].push(id)
        }
    }
    buildMultiIndex(keys, matchFilter = []) {


        if(matchFilter.length > 0){
            //match filter keys zu match filter true/false map umwandeln
            matchFilter = this.createMatchFilter(matchFilter[0],matchFilter[1])
        }

        for (var d in this.data) {
            var entry = this.data[d].data

            var allTerms = []

            for (var n in keys) {
                var key = keys[n]
                var parsedKey = this.jsonParser.buildKey(key)
                var terms;
                if (matchFilter.length > 0) {
                    terms = this.jsonParser.traverseWithKeyRec(parsedKey, entry, matchFilter[d])
                } else {
                    terms = this.jsonParser.traverseWithKeyRec(parsedKey, entry)
                }
                allTerms.push(terms)
            }

            //überprüfen ob alle term arrays gleich lang (sonst macht multi index kein sinn!)

            for (var i in allTerms) {
                if (allTerms[i].length != allTerms[0].length) {
                    console.log("Fehler, evtl keine 1:1 Beziehung im Multi-Index.")
                    return
                }
            }

            for (var i in allTerms[0]) {
                var multiKey = []
                for (var l in allTerms) {
                    multiKey.push(allTerms[l][i])
                }
                var multiKeyString = JSON.stringify(multiKey)
                this.addToIndex(this.data[d].id, multiKeyString)
            }
        }

    }
    createMatchFilter(keyOne, keyTwo) {
        //Schaut ob der erste Key in dem Ergebniss vom den anderen vorkommt => Nur wenn dies zutrifft ist es in filter Liste (basierend of erstem Key) => nachher filter liste bei traversewithkeyrec filtern
        //wenn match => eintrag in filter array it position [1,2,3,etc], dann verwenden in traverseWithKeyRec

        var matchFilter = []

        for (var d in this.data) {
            var entry = this.data[d].data

            var parsedKey = this.jsonParser.buildKey(keyOne)
            var findMatchTerms = this.jsonParser.traverseWithKeyRec(parsedKey, entry)


            var parsedKey = this.jsonParser.buildKey(keyTwo)
            var matchTerms = this.jsonParser.traverseWithKeyRec(parsedKey, entry)


            var matches = []

            for (var i in findMatchTerms) {
                var e = findMatchTerms[i]
                if (matchTerms.includes(e)) {
                    matches.push(true)
                } else {
                    matches.push(false)
                }
            }

            matchFilter.push(matches)
        }


        return matchFilter


    }

}

module.exports = {
    Index
};