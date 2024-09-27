const { EmbeddingBuilder } = require("../embeddingBuilder");


class SimpleVariantsEmbBuilder extends EmbeddingBuilder {
    constructor(data) {
        super(data)
    }


    addSNVFields(fieldName) {
        var fields = {
            gene: "ngsReports.*.results.simpleVariants.*.gene.code",
            dnaChange: "ngsReports.*.results.simpleVariants.*.dnaChange.code",
            proteinChange: "ngsReports.*.results.simpleVariants.*.proteinChange.code",
            simpleVariantId: "ngsReports.*.results.simpleVariants.*.id",
            supportingVariantIds: "carePlans.*.medicationRecommendations.*.supportingVariants.*.id"
        }


        for (var i in this.data) {
            var entry = this.data[i].data
            // console.log(entry)

            var simpleVariantIds = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.simpleVariantId), entry)
            var simpleVariantGenes = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.gene), entry)
            var simpleVariantDnaChange = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.dnaChange), entry)
            var simpleVariantProteinChange = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.proteinChange), entry)
            var supportingVariantIds = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(fields.supportingVariantIds), entry)

            for (var n in simpleVariantIds) {
                var gene = simpleVariantGenes[n]
                var dnaChange = simpleVariantDnaChange[n]
                var proteinChange = simpleVariantProteinChange[n]
                var supporting = false

                if (supportingVariantIds.includes(simpleVariantIds[n])) {
                    supporting = true
                }

                var field = { gene: gene, dnaChange: dnaChange, proteinChange: proteinChange, supportingVariant: supporting }

                this.addToField(fieldName, this.data[i].id, JSON.stringify(field))

            }
        }
    }

    load() {
        this.addSNVFields('simpleVariants')
        this.addEmbedding(['simpleVariants'])
    }




    // //TODO: Alle sehr kompliziert => Strukturen, vorallem für supportigEvidence lässt sich vereinfachen 

    // //genes:"ngsReports.*.results.simpleVariants.*.gene.code",dnaChange: ngsReports.*.results.simpleVariants.*.dnaChange.code

    // addSNVFields(fieldName) {


    //     //Wichtiges bei SNV: gene, dnaChange und proteinChange, supportingVariant immer gekoppelt betrachten 
    //     var fields = {
    //         gene: "ngsReports.*.results.simpleVariants.*.gene.code",
    //         dnaChange: "ngsReports.*.results.simpleVariants.*.dnaChange.code",
    //         proteinChange: "ngsReports.*.results.simpleVariants.*.proteinChange.code"
    //     }

    //     var tempFields = []

    //     //Relevante Daten für jeden Record sammeln
    //     var tempPlainResults = {}
    //     for (var name in fields) {
    //         var key = fields[name]
    //         for (var i in this.data) {
    //             var entry = this.data[i].data
    //             var id = this.data[i].id
    //             var entryFields = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey(key), entry)
    //             if (tempPlainResults[name] == undefined) {
    //                 tempPlainResults[name] = {}
    //             }
    //             if (tempPlainResults[name][id] == undefined) {
    //                 tempPlainResults[name][id] = []
    //             }

    //             tempPlainResults[name][id] = [].concat(entryFields)
    //         }

    //     }

    //     //["ngsReports.*.results.simpleVariants.*.id","carePlans.*.medicationRecommendations.*.supportingEvidence.*.id"]
    //     //supporting Variants für jeden Record hinzufügen

    //     fields['supportingVariant'] = "custom"
    //     for (var i in this.data) {
    //         var entry = this.data[i].data
    //         var id = this.data[i].id
    //         var variantIds = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey("ngsReports.*.results.simpleVariants.*.id"), entry)
    //         var supportingVariantIds = this.jsonParser.traverseWithKeyRec(this.jsonParser.buildKey("carePlans.*.medicationRecommendations.*.supportingEvidence.*.id"), entry)

    //         var supportingA = []
    //         for (var n in variantIds) {
    //             var vId = variantIds[n]
    //             if (supportingVariantIds.includes(vId)) {
    //                 supportingA.push(true)
    //             } else {
    //                 supportingA.push(false)
    //             }
    //         }
    //         if (tempPlainResults["supportingVariant"] == undefined) {
    //             tempPlainResults["supportingVariant"] = {}
    //         }
    //         tempPlainResults["supportingVariant"][id] = supportingA
    //     }




    //     for (var id in tempPlainResults[Object.keys(tempPlainResults)[0]]) {
    //         var plainResultFields = []
    //         for (var counter in tempPlainResults[Object.keys(tempPlainResults)[0]][id]) {
    //             var acc = {}
    //             for (var name in tempPlainResults) {
    //                 var a = tempPlainResults[name][id][counter]
    //                 acc[name] = a
    //             }

    //             if (!tempFields.includes(JSON.stringify(acc))) {
    //                 tempFields.push(JSON.stringify(acc))
    //             }

    //             if (!plainResultFields.includes(JSON.stringify(acc))) {
    //                 plainResultFields.push(JSON.stringify(acc))
    //             }
    //         }

    //         if (this.plainResults[fieldName] == undefined) {
    //             this.plainResults[fieldName] = []
    //         }

    //         this.plainResults[fieldName].push({ id: id, fields: plainResultFields })
    //     }



    //     this.fields[fieldName] = tempFields




    // }

}

module.exports = {
    SimpleVariantsEmbBuilder
};